/**
 * Free Gravity - OmniRoute Multi-Provider AI Routing Gateway
 * 
 * Multi-provider AI routing gateway supporting:
 * - Local OmniRoute sidecar (http://127.0.0.1:4100/v1/chat/completions)
 * - OpenRouter free endpoints (nousresearch/hermes-3-llama-3.1-70b:free, nousresearch/hermes-3-llama-3.1-405b:free)
 * - Local Ollama offline fallback (http://127.0.0.1:11434/api/chat with hermes3)
 * - Token-bucket rate-limit buffer (20 req/min queue + exponential backoff)
 * - Automatic zero-downtime failover mid-session on 429, 5xx, or network timeout.
 */

import { EventEmitter } from "node:events";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
  stream?: boolean;
  signal?: AbortSignal;
}

export interface ChatCompletionResponse {
  id: string;
  provider: string;
  model: string;
  content: string;
  finish_reason: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  durationMs: number;
}

export interface ChatStreamChunk {
  id: string;
  provider: string;
  model: string;
  delta: string;
  isComplete: boolean;
  finish_reason?: string | null;
}

export type ProviderHealthState = "HEALTHY" | "RATE_LIMITED" | "DEGRADED" | "OFFLINE";

export interface ProviderRouteConfig {
  id: string;
  name: string;
  type: "omniroute" | "openrouter" | "ollama";
  baseUrl: string;
  model: string;
  apiKey?: string;
  priority: number;
  timeoutMs: number;
  maxRetries: number;
  rateLimitPerMinute: number;
}

export interface ProviderState {
  config: ProviderRouteConfig;
  health: ProviderHealthState;
  consecutiveFailures: number;
  lastFailureTime?: number;
  cooldownUntil?: number;
  totalRequests: number;
  successfulRequests: number;
}

/**
 * Token Bucket Rate Limiter with FIFO Request Queue
 * Smooths out bursty requests to stay within rate limits (e.g. 20 requests per minute).
 */
export class TokenBucketRateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRatePerMs: number;
  private lastRefillTimestamp: number;
  private queue: Array<{
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  }> = [];

  constructor(maxTokens = 20, refillIntervalMs = 60000) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRatePerMs = maxTokens / refillIntervalMs;
    this.lastRefillTimestamp = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTimestamp;
    if (elapsed > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRatePerMs);
      this.lastRefillTimestamp = now;
    }
  }

  public getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  public async acquire(timeoutMs = 90000): Promise<void> {
    this.refill();

    if (this.tokens >= 1 && this.queue.length === 0) {
      this.tokens -= 1;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex(item => item.timer === timer);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
          reject(new Error(`Rate limit queue timeout after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.queue.push({ resolve, reject, timer });
      this.scheduleNextDrain();
    });
  }

  private scheduleNextDrain(): void {
    if (this.queue.length === 0) return;

    this.refill();
    if (this.tokens >= 1) {
      const next = this.queue.shift();
      if (next) {
        clearTimeout(next.timer);
        this.tokens -= 1;
        next.resolve();
      }
      if (this.queue.length > 0) {
        this.scheduleNextDrain();
      }
      return;
    }

    const neededTokens = 1 - this.tokens;
    const waitMs = Math.ceil(neededTokens / this.refillRatePerMs) + 50;
    setTimeout(() => {
      this.scheduleNextDrain();
    }, waitMs);
  }
}

/**
 * OmniRoute Gateway manages routes, rate limits, and seamless failovers
 */
export class OmniRouteGateway extends EventEmitter {
  private providers: ProviderState[] = [];
  private rateLimiter: TokenBucketRateLimiter;
  private readonly defaultTimeoutMs = 45000;

  constructor(customConfigs?: Partial<ProviderRouteConfig>[]) {
    super();
    this.rateLimiter = new TokenBucketRateLimiter(20, 60000);
    this.initDefaultProviders(customConfigs);
  }

  private initDefaultProviders(customConfigs?: Partial<ProviderRouteConfig>[]): void {
    const openRouterKey = process.env.OPENROUTER_API_KEY || "";
    const omniRouteHost = process.env.OMNIROUTE_URL || "http://127.0.0.1:4100";
    const ollamaHost = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

    const defaultConfigs: ProviderRouteConfig[] = [
      // Route 1: Local OmniRoute Sidecar (Lowest latency, local orchestration)
      {
        id: "omniroute_sidecar",
        name: "Local OmniRoute Sidecar",
        type: "omniroute",
        baseUrl: `${omniRouteHost.replace(/\/+$/, "")}/v1/chat/completions`,
        model: "hermes-3",
        priority: 1,
        timeoutMs: 30000,
        maxRetries: 2,
        rateLimitPerMinute: 60,
      },
      // Route 2: OpenRouter Free Hermes 3 70B (High capability cloud free tier)
      {
        id: "openrouter_hermes_70b",
        name: "OpenRouter Hermes 3 70B (Free)",
        type: "openrouter",
        baseUrl: "https://openrouter.ai/api/v1/chat/completions",
        model: "nousresearch/hermes-3-llama-3.1-70b:free",
        apiKey: openRouterKey,
        priority: 2,
        timeoutMs: 60000,
        maxRetries: 2,
        rateLimitPerMinute: 20,
      },
      // Route 3: OpenRouter Free Hermes 3 405B (Ultra-large model fallback)
      {
        id: "openrouter_hermes_405b",
        name: "OpenRouter Hermes 3 405B (Free)",
        type: "openrouter",
        baseUrl: "https://openrouter.ai/api/v1/chat/completions",
        model: "nousresearch/hermes-3-llama-3.1-405b:free",
        apiKey: openRouterKey,
        priority: 3,
        timeoutMs: 90000,
        maxRetries: 2,
        rateLimitPerMinute: 10,
      },
      // Route 4: Local Ollama Offline Fallback (100% offline, guaranteed uptime)
      {
        id: "ollama_local",
        name: "Local Ollama Offline Fallback",
        type: "ollama",
        baseUrl: `${ollamaHost.replace(/\/+$/, "")}/api/chat`,
        model: process.env.OLLAMA_MODEL || "hermes3",
        priority: 4,
        timeoutMs: 90000,
        maxRetries: 1,
        rateLimitPerMinute: 120,
      },
    ];

    // Merge custom configs if provided
    const mergedConfigs: ProviderRouteConfig[] = defaultConfigs.map(def => {
      const found = customConfigs?.find(c => c.id === def.id);
      return found ? { ...def, ...found } : def;
    });

    if (customConfigs) {
      for (const custom of customConfigs) {
        if (custom.id && !mergedConfigs.some(m => m.id === custom.id)) {
          mergedConfigs.push({
            id: custom.id,
            name: custom.name || custom.id,
            type: custom.type || "openrouter",
            baseUrl: custom.baseUrl || "",
            model: custom.model || "hermes-3",
            apiKey: custom.apiKey,
            priority: custom.priority || 10,
            timeoutMs: custom.timeoutMs || 45000,
            maxRetries: custom.maxRetries || 2,
            rateLimitPerMinute: custom.rateLimitPerMinute || 20,
          });
        }
      }
    }

    this.providers = mergedConfigs
      .sort((a, b) => a.priority - b.priority)
      .map(config => ({
        config,
        health: "HEALTHY",
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0,
      }));
  }

  public getProviders(): ProviderState[] {
    return [...this.providers];
  }

  /**
   * Returns list of currently available providers, filtering out those in active cooldown
   */
  private getHealthyProviders(): ProviderState[] {
    const now = Date.now();
    return this.providers.filter(p => {
      if (p.cooldownUntil && p.cooldownUntil > now) {
        return false;
      }
      // If cooldown expired, recover to HEALTHY
      if (p.cooldownUntil && p.cooldownUntil <= now) {
        p.health = "HEALTHY";
        p.cooldownUntil = undefined;
        p.consecutiveFailures = 0;
        this.emit("provider_recovered", { providerId: p.config.id });
      }
      return true;
    });
  }

  /**
   * Marks a provider with a failure state and triggers cooldown
   */
  private recordFailure(provider: ProviderState, status?: number, errorMsg?: string): void {
    provider.consecutiveFailures += 1;
    provider.lastFailureTime = Date.now();

    const isRateLimit = status === 429;
    const isServerOrNetwork = !status || (status >= 500 && status < 600);

    if (isRateLimit) {
      provider.health = "RATE_LIMITED";
      // Cooldown for 60 seconds on rate limit
      provider.cooldownUntil = Date.now() + 60000;
      this.emit("provider_rate_limited", {
        providerId: provider.config.id,
        cooldownSeconds: 60,
        error: errorMsg,
      });
    } else if (isServerOrNetwork) {
      if (provider.consecutiveFailures >= 2) {
        provider.health = "OFFLINE";
        provider.cooldownUntil = Date.now() + 30000; // 30s cooldown
      } else {
        provider.health = "DEGRADED";
        provider.cooldownUntil = Date.now() + 10000; // 10s short backoff
      }
      this.emit("provider_degraded", {
        providerId: provider.config.id,
        health: provider.health,
        failures: provider.consecutiveFailures,
        error: errorMsg,
      });
    }
  }

  private recordSuccess(provider: ProviderState): void {
    provider.successfulRequests += 1;
    provider.consecutiveFailures = 0;
    provider.health = "HEALTHY";
    provider.cooldownUntil = undefined;
  }

  /**
   * Builds headers according to provider type
   */
  private buildHeaders(provider: ProviderRouteConfig): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "FreeGravity-OmniRoute/1.0",
    };

    if (provider.type === "openrouter") {
      headers["HTTP-Referer"] = "https://freegravity.dev";
      headers["X-Title"] = "Free Gravity";
      if (provider.apiKey) {
        headers["Authorization"] = `Bearer ${provider.apiKey}`;
      }
    } else if (provider.type === "omniroute") {
      if (provider.apiKey) {
        headers["Authorization"] = `Bearer ${provider.apiKey}`;
      }
    }

    return headers;
  }

  /**
   * Executes a non-streaming chat completion with automatic failover
   */
  public async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    await this.rateLimiter.acquire();

    const candidates = this.getHealthyProviders();
    if (candidates.length === 0) {
      // If all are cooling down, force use the local Ollama or lowest priority route
      const fallback = this.providers[this.providers.length - 1];
      candidates.push(fallback);
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let i = 0; i < candidates.length; i++) {
      const provider = candidates[i];
      provider.totalRequests += 1;

      try {
        this.emit("request_start", { providerId: provider.config.id, model: provider.config.model });

        const response = await this.executeSingleCompletion(provider, options);
        this.recordSuccess(provider);

        this.emit("request_complete", {
          providerId: provider.config.id,
          model: provider.config.model,
          durationMs: Date.now() - startTime,
        });

        return response;
      } catch (err: any) {
        lastError = err;
        const statusCode = err.status || err.statusCode;
        this.recordFailure(provider, statusCode, err.message);

        const nextProvider = candidates[i + 1];
        if (nextProvider) {
          this.emit("failover", {
            fromProvider: provider.config.id,
            toProvider: nextProvider.config.id,
            reason: err.message,
            attempt: i + 1,
          });
        }
      }
    }

    throw new Error(
      `OmniRouteGateway failed across all available providers. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Dispatches completion request to a specific provider
   */
  private async executeSingleCompletion(
    providerState: ProviderState,
    options: ChatCompletionOptions
  ): Promise<ChatCompletionResponse> {
    const { config } = providerState;
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), config.timeoutMs || this.defaultTimeoutMs);

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    const startTime = Date.now();

    try {
      if (config.type === "ollama" && config.baseUrl.includes("/api/chat")) {
        // Native Ollama API format
        const body = {
          model: config.model,
          messages: options.messages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            top_p: options.top_p ?? 0.9,
            num_predict: options.max_tokens ?? 4096,
            stop: options.stop,
          },
        };

        const res = await fetch(config.baseUrl, {
          method: "POST",
          headers: this.buildHeaders(config),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const err: any = new Error(`Ollama error HTTP ${res.status}: ${errText}`);
          err.status = res.status;
          throw err;
        }

        const data: any = await res.json();
        const durationMs = Date.now() - startTime;

        return {
          id: `ollama-${Date.now()}`,
          provider: config.id,
          model: config.model,
          content: data.message?.content || "",
          finish_reason: data.done ? "stop" : "unknown",
          durationMs,
        };
      } else {
        // OpenAI ChatCompletions compatible format (OmniRoute, OpenRouter, Ollama /v1)
        const body: Record<string, any> = {
          model: config.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          top_p: options.top_p ?? 0.9,
          max_tokens: options.max_tokens ?? 4096,
          stream: false,
        };
        if (options.stop) body.stop = options.stop;

        const res = await fetch(config.baseUrl, {
          method: "POST",
          headers: this.buildHeaders(config),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const err: any = new Error(`${config.name} HTTP ${res.status}: ${errText}`);
          err.status = res.status;
          throw err;
        }

        const data: any = await res.json();
        const choice = data.choices?.[0];
        const durationMs = Date.now() - startTime;

        return {
          id: data.id || `chat-${Date.now()}`,
          provider: config.id,
          model: data.model || config.model,
          content: choice?.message?.content || "",
          finish_reason: choice?.finish_reason || "stop",
          usage: data.usage,
          durationMs,
        };
      }
    } finally {
      clearTimeout(timeoutTimer);
    }
  }

  /**
   * Executes a streaming chat completion with transparent zero-downtime failover before first chunk
   */
  public async *chatStream(options: ChatCompletionOptions): AsyncGenerator<ChatStreamChunk, void, unknown> {
    await this.rateLimiter.acquire();

    const candidates = this.getHealthyProviders();
    if (candidates.length === 0) {
      candidates.push(this.providers[this.providers.length - 1]);
    }

    let lastError: Error | null = null;

    for (let i = 0; i < candidates.length; i++) {
      const provider = candidates[i];
      provider.totalRequests += 1;
      let hasYieldedAnyChunk = false;

      try {
        this.emit("stream_start", { providerId: provider.config.id, model: provider.config.model });

        const streamGen = this.executeSingleStream(provider, options);
        for await (const chunk of streamGen) {
          hasYieldedAnyChunk = true;
          yield chunk;
        }

        this.recordSuccess(provider);
        this.emit("stream_complete", { providerId: provider.config.id });
        return;
      } catch (err: any) {
        lastError = err;
        const statusCode = err.status || err.statusCode;
        this.recordFailure(provider, statusCode, err.message);

        // If chunks were already yielded to the caller, we cannot cleanly restart without duplicate output
        if (hasYieldedAnyChunk) {
          throw new Error(`Streaming interrupted on provider ${provider.config.name}: ${err.message}`);
        }

        const nextProvider = candidates[i + 1];
        if (nextProvider) {
          this.emit("failover", {
            fromProvider: provider.config.id,
            toProvider: nextProvider.config.id,
            reason: err.message,
            attempt: i + 1,
            streaming: true,
          });
        }
      }
    }

    throw new Error(
      `OmniRouteGateway streaming failed across all providers. Last error: ${lastError?.message || "Unknown error"}`
    );
  }

  /**
   * Single provider streaming generator
   */
  private async *executeSingleStream(
    providerState: ProviderState,
    options: ChatCompletionOptions
  ): AsyncGenerator<ChatStreamChunk, void, unknown> {
    const { config } = providerState;
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), config.timeoutMs || this.defaultTimeoutMs);

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      if (config.type === "ollama" && config.baseUrl.includes("/api/chat")) {
        // Native Ollama streaming
        const body = {
          model: config.model,
          messages: options.messages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          options: {
            temperature: options.temperature ?? 0.7,
            top_p: options.top_p ?? 0.9,
            num_predict: options.max_tokens ?? 4096,
            stop: options.stop,
          },
        };

        const res = await fetch(config.baseUrl, {
          method: "POST",
          headers: this.buildHeaders(config),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const err: any = new Error(`Ollama HTTP ${res.status}: ${errText}`);
          err.status = res.status;
          throw err;
        }

        if (!res.body) {
          throw new Error("No response body received for streaming");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              const delta = parsed.message?.content || "";
              const isDone = !!parsed.done;

              if (delta || isDone) {
                yield {
                  id: `ollama-${Date.now()}`,
                  provider: config.id,
                  model: config.model,
                  delta,
                  isComplete: isDone,
                  finish_reason: isDone ? "stop" : null,
                };
              }
            } catch {
              // Ignore line parse errors in stream
            }
          }
        }
      } else {
        // OpenAI compatible SSE stream (OpenRouter, OmniRoute)
        const body: Record<string, any> = {
          model: config.model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          top_p: options.top_p ?? 0.9,
          max_tokens: options.max_tokens ?? 4096,
          stream: true,
        };
        if (options.stop) body.stop = options.stop;

        const res = await fetch(config.baseUrl, {
          method: "POST",
          headers: this.buildHeaders(config),
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const err: any = new Error(`${config.name} HTTP ${res.status}: ${errText}`);
          err.status = res.status;
          throw err;
        }

        if (!res.body) {
          throw new Error("No response body received for SSE stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue; // Skip comments/keepalive

            if (trimmed.startsWith("data:")) {
              const dataStr = trimmed.substring(5).trim();
              if (dataStr === "[DONE]") {
                yield {
                  id: `stream-done`,
                  provider: config.id,
                  model: config.model,
                  delta: "",
                  isComplete: true,
                  finish_reason: "stop",
                };
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const choice = parsed.choices?.[0];
                const delta = choice?.delta?.content || "";
                const finishReason = choice?.finish_reason;
                const isComplete = !!finishReason;

                if (delta || isComplete) {
                  yield {
                    id: parsed.id || `stream-chunk`,
                    provider: config.id,
                    model: parsed.model || config.model,
                    delta,
                    isComplete,
                    finish_reason: finishReason,
                  };
                }
              } catch {
                // Ignore SSE line parse errors
              }
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutTimer);
    }
  }
}

// Export singleton helper
export const omniRoute = new OmniRouteGateway();
