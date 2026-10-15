/**
 * Free Gravity - WebSocket Client & Real-Time Event Bus
 * 
 * Connects the Studio UI (/app) to the server bus (Port 4200):
 * - Hermes 3 ReAct agent loop (streaming <thought>, tool calls, skill synthesis)
 * - Playwright CDP Screencast & Browser Actions
 * - Interactive Terminal Bridge (xterm.js / node-pty)
 * - OWASP ASI Security Guard & HITL Interceptor
 * - Unified MCP Tools Registry
 */

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface WSMessage<T = any> {
  type: string;
  payload?: T;
  requestId?: string;
  channel?: string;
  timestamp?: number;
}

// Server Event Payloads
export interface ServerConnectedPayload {
  clientId: string;
  version: string;
  workspaceRoot: string;
  services: {
    security: boolean;
    browser: boolean;
    terminal: boolean;
    agentLoop: boolean;
    mcpHost: boolean;
  };
}

export interface ThoughtDeltaPayload {
  delta: string;
  fullThought?: string;
  step?: number;
}

export interface ThoughtCompletePayload {
  thought: string;
  durationSeconds?: number;
  step?: number;
}

export interface ToolCallStartPayload {
  callId: string;
  name: string;
  arguments: Record<string, any>;
  step?: number;
}

export interface ToolCallOutputPayload {
  callId: string;
  toolName?: string;
  output: string;
  isStderr?: boolean;
  step?: number;
}

export interface ToolCallCompletePayload {
  callId: string;
  name?: string;
  result: any;
  durationMs?: number;
  step?: number;
}

export interface AgentContentDeltaPayload {
  delta: string;
  fullContent?: string;
  step?: number;
}

export interface AgentCompletePayload {
  success: boolean;
  finalAnswer: string;
  totalTurns: number;
  allThoughts: string[];
  toolsExecuted: Array<{ name: string; args: any; status: string }>;
  messages: any[];
  error?: string;
}

export interface HitlRequiredPayload {
  id: string;
  command: string;
  reasons: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface BrowserFramePayload {
  data: string; // base64 jpeg / png
  metadata?: {
    timestamp: number;
    width: number;
    height: number;
  };
}

export interface TerminalDataPayload {
  sessionId: string;
  data: string;
}

export interface McpToolItem {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

type EventCallback<T = any> = (payload: T) => void;

export class FreeGravityWsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private pendingRequests: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private isExplicitlyClosed = false;

  constructor(customUrl?: string) {
    if (customUrl) {
      this.url = customUrl;
    } else {
      const hostname = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
      const port = 4200;
      const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.url = `${protocol}//${hostname}:${port}`;
    }
  }

  public getState(): ConnectionState {
    return this.connectionState;
  }

  public isConnected(): boolean {
    return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.setConnectionState('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setConnectionState('connected');
        this.emit('status', { state: 'connected', url: this.url });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
        } catch (err) {
          console.error('[WS-Client] Failed to parse message JSON:', err);
        }
      };

      this.ws.onclose = () => {
        this.setConnectionState('disconnected');
        this.emit('status', { state: 'disconnected' });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WS-Client] Connection error (will auto-reconnect):', err);
        this.emit('error', err);
      };
    } catch (err) {
      this.setConnectionState('disconnected');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.emit('connection_change', state);
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed) return;
    this.setConnectionState('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleIncomingMessage(msg: WSMessage): void {
    // Check if message corresponds to a pending promise request
    if (msg.requestId && this.pendingRequests.has(msg.requestId)) {
      const { resolve } = this.pendingRequests.get(msg.requestId)!;
      this.pendingRequests.delete(msg.requestId);
      resolve(msg.payload);
    }

    // Trigger specific type listeners
    this.emit(msg.type, msg.payload);

    // Trigger universal wildcard listener
    this.emit('*', msg);
  }

  public send(type: string, payload?: any, requestId?: string): void {
    if (!this.isConnected() || !this.ws) {
      console.warn(`[WS-Client] Cannot send '${type}': socket is not connected.`);
      return;
    }

    const message: WSMessage = {
      type,
      payload,
      requestId,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  public request<T = any>(type: string, payload?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error(`WebSocket is not connected (current state: ${this.connectionState})`));
        return;
      }

      const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      this.pendingRequests.set(requestId, { resolve, reject });

      // 30s timeout for requests
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`WebSocket request timeout for '${type}'`));
        }
      }, 30000);

      this.send(type, payload, requestId);
    });
  }

  // Event Subscription
  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off<T = any>(event: string, callback: EventCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, payload: any): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const cb of set) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[WS-Client] Error in listener for '${event}':`, err);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // High-Level Domain Helpers
  // --------------------------------------------------------------------------

  // Hermes 3 Agent Loop
  public sendAgentMessage(prompt: string, options?: { maxTurns?: number; temperature?: number; model?: string }): void {
    this.send('agent:message', { prompt, options });
  }

  // Security & HITL Guard
  public resolveHitl(requestId: string, approved: boolean, approver = 'user'): void {
    this.send('security:hitl_response', { requestId, approved, approver });
  }

  // Terminal Bridge
  public async createTerminalSession(options?: { cols?: number; rows?: number; cwd?: string }): Promise<string> {
    const res = await this.request<{ sessionId: string }>('terminal:create', { options });
    return res.sessionId;
  }

  public sendTerminalInput(sessionId: string, data: string): void {
    this.send('terminal:input', { sessionId, data });
  }

  public resizeTerminal(sessionId: string, cols: number, rows: number): void {
    this.send('terminal:resize', { sessionId, cols, rows });
  }

  public killTerminal(sessionId: string): void {
    this.send('terminal:kill', { sessionId });
  }

  // Browser CDP Screencast & Actions
  public startBrowserScreencast(): void {
    this.send('browser:start_screencast');
  }

  public stopBrowserScreencast(): void {
    this.send('browser:stop_screencast');
  }

  public async executeBrowserAction(action: string, params: Record<string, any> = {}): Promise<any> {
    return this.request('browser:action', { action, ...params });
  }

  public async triggerBrowserTakeover(): Promise<any> {
    return this.request('browser:takeover_start');
  }

  public async resumeBrowserControl(): Promise<any> {
    return this.request('browser:takeover_resume');
  }

  // MCP Tools
  public async listMcpTools(): Promise<McpToolItem[]> {
    return this.request<McpToolItem[]>('mcp:list_tools');
  }

  public async callMcpTool(toolName: string, args: Record<string, any>): Promise<any> {
    return this.request('mcp:call_tool', { toolName, args });
  }
}

// Singleton global client
export const wsClient = new FreeGravityWsClient();
