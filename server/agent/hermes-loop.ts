/**
 * Free Gravity - Hermes 3 Autonomous ReAct Agent Loop
 * 
 * Autonomous multi-step ReAct agent loop implementing:
 * - Nous Hermes 3 ChatML convention (<tools>, <thought>, <tool_call>, <tool_response>)
 * - Real-time streaming events (thought_delta, thought_complete, tool_call_start, tool_call_output, tool_call_complete, assistant_message)
 * - Persistent workspace memory (.freegravity/memory.json)
 * - /learn skill synthesis inspired by NousResearch/hermes-agent
 * - Full integration with DefensiveParser, OmniRouteGateway, and McpHost
 */

import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { EventEmitter } from "node:events";
import {
  parseHermesOutput,
  StreamingThoughtParser,
  ParsedToolCall,
  generateCallId,
} from "./defensive-parser.js";
import { OmniRouteGateway, omniRoute, ChatMessage } from "./omniroute-gateway.js";
import { McpHost, defaultMcpHost, ToolResult } from "../mcp/mcp-host.js";
import { registerReaSkills, REA_SYSTEM_PROMPT } from "../mcp/rea-skill.js";

export interface AgentSkill {
  name: string;
  description: string;
  instructions: string;
  filePath: string;
  createdAt: number;
}

export interface WorkspaceMemory {
  projectName: string;
  learnedFacts: string[];
  userPreferences: Record<string, any>;
  sessionSummaries: Array<{
    timestamp: string;
    task: string;
    outcome: string;
    toolsUsed: string[];
  }>;
  skills: AgentSkill[];
}

export interface HermesLoopOptions {
  workspaceRoot?: string;
  gateway?: OmniRouteGateway;
  mcpHost?: McpHost;
  maxTurns?: number;
  temperature?: number;
  systemPromptOverride?: string;
  signal?: AbortSignal;
}

export interface HermesLoopResult {
  success: boolean;
  finalAnswer: string;
  totalTurns: number;
  allThoughts: string[];
  toolsExecuted: Array<{ name: string; args: any; status: string }>;
  messages: ChatMessage[];
  error?: string;
}

/**
 * Workspace Memory Manager handles persistence of learned facts, preferences, and skills
 */
export class WorkspaceMemoryManager {
  private workspaceRoot: string;
  private memoryFilePath: string;
  private skillsDir: string;
  private memoryCache?: WorkspaceMemory;

  constructor(workspaceRoot = process.cwd()) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.memoryFilePath = path.join(this.workspaceRoot, ".freegravity", "memory.json");
    this.skillsDir = path.join(this.workspaceRoot, ".freegravity", "skills");
  }

  public async init(): Promise<void> {
    const freeGravityDir = path.join(this.workspaceRoot, ".freegravity");
    await fsp.mkdir(freeGravityDir, { recursive: true });
    await fsp.mkdir(this.skillsDir, { recursive: true });
  }

  public async load(): Promise<WorkspaceMemory> {
    await this.init();

    if (this.memoryCache) {
      return this.memoryCache;
    }

    try {
      if (fs.existsSync(this.memoryFilePath)) {
        const raw = await fsp.readFile(this.memoryFilePath, "utf-8");
        this.memoryCache = JSON.parse(raw);
        return this.memoryCache!;
      }
    } catch {
      // Fall through to default
    }

    const defaultMemory: WorkspaceMemory = {
      projectName: path.basename(this.workspaceRoot),
      learnedFacts: [],
      userPreferences: {},
      sessionSummaries: [],
      skills: [],
    };

    this.memoryCache = defaultMemory;
    await this.save(defaultMemory);
    return defaultMemory;
  }

  public async save(memory: WorkspaceMemory): Promise<void> {
    await this.init();
    this.memoryCache = memory;
    await fsp.writeFile(this.memoryFilePath, JSON.stringify(memory, null, 2), "utf-8");
  }

  public async addLearnedFact(fact: string): Promise<void> {
    const memory = await this.load();
    if (!memory.learnedFacts.includes(fact)) {
      memory.learnedFacts.push(fact);
      await this.save(memory);
    }
  }

  public async saveSkill(name: string, description: string, instructions: string): Promise<AgentSkill> {
    await this.init();
    const memory = await this.load();

    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
    const skillFileName = `${sanitizedName}.md`;
    const skillFilePath = path.join(this.skillsDir, skillFileName);

    const fileContent = [
      `---`,
      `name: ${sanitizedName}`,
      `description: ${description}`,
      `created: ${new Date().toISOString()}`,
      `---`,
      ``,
      `# Skill: ${sanitizedName}`,
      ``,
      `> ${description}`,
      ``,
      `## Instructions & Procedures`,
      instructions,
    ].join("\n");

    await fsp.writeFile(skillFilePath, fileContent, "utf-8");

    const newSkill: AgentSkill = {
      name: sanitizedName,
      description,
      instructions,
      filePath: skillFilePath,
      createdAt: Date.now(),
    };

    // Replace existing skill with same name or add new
    const existingIndex = memory.skills.findIndex(s => s.name === sanitizedName);
    if (existingIndex !== -1) {
      memory.skills[existingIndex] = newSkill;
    } else {
      memory.skills.push(newSkill);
    }

    await this.save(memory);
    return newSkill;
  }

  public async addSessionSummary(task: string, outcome: string, toolsUsed: string[]): Promise<void> {
    const memory = await this.load();
    memory.sessionSummaries.push({
      timestamp: new Date().toISOString(),
      task,
      outcome,
      toolsUsed,
    });
    // Keep max 20 summaries
    if (memory.sessionSummaries.length > 20) {
      memory.sessionSummaries = memory.sessionSummaries.slice(-20);
    }
    await this.save(memory);
  }

  /**
   * Formats persistent facts and stored skills for inclusion in the system prompt
   */
  public formatForSystemPrompt(memory: WorkspaceMemory): string {
    const sections: string[] = [];

    if (memory.learnedFacts.length > 0) {
      sections.push(
        `### Workspace Knowledge & Learned Facts:\n` +
        memory.learnedFacts.map(fact => `- ${fact}`).join("\n")
      );
    }

    if (memory.skills.length > 0) {
      sections.push(
        `### Active Synthesized Skills:\n` +
        memory.skills.map(s => `- /${s.name}: ${s.description}\n  ${s.instructions}`).join("\n\n")
      );
    }

    return sections.join("\n\n");
  }
}

/**
 * Autonomous ReAct Agent Loop for Nous Hermes 3
 */
export class HermesAgentLoop extends EventEmitter {
  private workspaceRoot: string;
  private gateway: OmniRouteGateway;
  private mcpHost: McpHost;
  private memoryManager: WorkspaceMemoryManager;
  private maxTurns: number;
  private temperature: number;

  constructor(options?: HermesLoopOptions) {
    super();
    this.workspaceRoot = options?.workspaceRoot ? path.resolve(options.workspaceRoot) : process.cwd();
    this.gateway = options?.gateway || omniRoute;
    this.mcpHost = options?.mcpHost || defaultMcpHost;
    this.maxTurns = options?.maxTurns ?? 25;
    this.temperature = options?.temperature ?? 0.7;
    this.memoryManager = new WorkspaceMemoryManager(this.workspaceRoot);

    // Ensure REA skills are registered
    registerReaSkills(this.mcpHost);
  }

  public getMemoryManager(): WorkspaceMemoryManager {
    return this.memoryManager;
  }

  /**
   * Constructs the master Hermes 3 system prompt with tool definitions and workspace memory
   */
  private async buildSystemPrompt(isReaMode = false, customOverride?: string): Promise<string> {
    if (customOverride) {
      return customOverride;
    }

    const memory = await this.memoryManager.load();
    const memorySnippet = this.memoryManager.formatForSystemPrompt(memory);
    const toolsJson = JSON.stringify(this.mcpHost.getHermesToolDefinitions(), null, 2);

    const basePrompt = [
      `You are Free Gravity, an expert autonomous coding and engineering agent powered by Nous Hermes 3.`,
      `You operate directly in the local workspace: '${this.workspaceRoot}'.`,
      `You are fully open-source, local-first, privacy-respecting, and free.`,
      ``,
      `### Core Behavior & Operating Rules:`,
      `1. Think before acting: Enclose your internal reasoning and step-by-step plan inside <thought>...</thought> tags.`,
      `2. Autonomous Execution: Use tools to inspect files, execute commands, modify code, and verify your changes.`,
      `3. Hermes Tool Calling Format:`,
      `   When calling a tool, you MUST output:`,
      `   <tool_call>`,
      `   {"name": "tool_name", "arguments": {"arg1": "value1"}}`,
      `   </tool_call>`,
      `4. After a tool call, wait for the <tool_response> from the system before proceeding.`,
      `5. Once you have completely finished the task, provide your final response directly to the user without calling more tools.`,
      `6. Skill Synthesis (/learn): You can synthesize and permanently retain reusable skills. When the user asks to learn a skill or when you discover a repeatable workflow, formulate a clear procedure.`,
      ``,
      isReaMode ? `### REA MODE ACTIVATED:\n${REA_SYSTEM_PROMPT}\n` : "",
      memorySnippet ? `${memorySnippet}\n` : "",
      `### Available Tools:`,
      `<tools>`,
      toolsJson,
      `</tools>`,
    ].join("\n");

    return basePrompt;
  }

  /**
   * Executes a complete multi-step autonomous task
   */
  public async run(userPrompt: string, options?: Partial<HermesLoopOptions>): Promise<HermesLoopResult> {
    return this.runTask(userPrompt, options);
  }

  public async runTask(userPrompt: string, options?: Partial<HermesLoopOptions>): Promise<HermesLoopResult> {
    const maxTurns = options?.maxTurns ?? this.maxTurns;
    const isReaMode = userPrompt.trim().startsWith("/rea");
    const isLearnCommand = userPrompt.trim().startsWith("/learn");

    // Special handling for /learn invocation
    if (isLearnCommand) {
      return this.handleLearnCommand(userPrompt);
    }

    const systemPrompt = await this.buildSystemPrompt(isReaMode, options?.systemPromptOverride);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const allThoughts: string[] = [];
    const toolsExecuted: Array<{ name: string; args: any; status: string }> = [];
    let turnCount = 0;
    let finalAnswer = "";

    this.emit("agent_start", { prompt: userPrompt, workspace: this.workspaceRoot });

    while (turnCount < maxTurns) {
      turnCount++;
      this.emit("agent_step_start", { step: turnCount, maxSteps: maxTurns });

      let turnRawContent = "";
      const thoughtParser = new StreamingThoughtParser();

      try {
        // Stream turn from OmniRoute Gateway
        const stream = this.gateway.chatStream({
          messages,
          temperature: options?.temperature ?? this.temperature,
          signal: options?.signal,
        });

        for await (const chunk of stream) {
          if (chunk.delta) {
            turnRawContent += chunk.delta;

            // Feed chunk into streaming thought parser for live WebSocket emission
            thoughtParser.feed(chunk.delta, {
              onThoughtDelta: (delta) => {
                this.emit("thought_delta", { delta, step: turnCount });
              },
              onThoughtComplete: (thought) => {
                allThoughts.push(thought);
                this.emit("thought_complete", { thought, step: turnCount });
              },
              onContentDelta: (delta) => {
                this.emit("assistant_content_delta", { delta, step: turnCount });
              },
            });
          }
        }

        thoughtParser.flush({
          onThoughtComplete: (thought) => {
            if (!allThoughts.includes(thought)) {
              allThoughts.push(thought);
              this.emit("thought_complete", { thought, step: turnCount });
            }
          },
        });

        // Parse turn output with Defensive Parser
        const parsed = parseHermesOutput(turnRawContent, this.mcpHost);

        // Record any thoughts parsed from complete block
        for (const t of parsed.thoughts) {
          if (!allThoughts.includes(t)) {
            allThoughts.push(t);
          }
        }

        // If the model invoked tool calls
        if (parsed.hasToolCalls) {
          // Append assistant message with its tool calls
          messages.push({
            role: "assistant",
            content: turnRawContent,
          });

          // Execute each tool call
          for (const call of parsed.toolCalls) {
            const callId = call.id || generateCallId();

            if (!call.isValid) {
              // Self-healing: feed correction response directly back to model
              const correction = call.correctionResponse || `<tool_response>\n{"status": "error", "error": "${call.validationError}"}\n</tool_response>`;
              this.emit("tool_call_invalid", { callId, toolName: call.name, error: call.validationError });

              messages.push({
                role: "tool",
                content: correction,
                name: call.name,
                tool_call_id: callId,
              });
              continue;
            }

            this.emit("tool_call_start", {
              callId,
              toolName: call.name,
              arguments: call.arguments,
              step: turnCount,
            });

            const startTime = Date.now();
            const result: ToolResult = await this.mcpHost.executeTool(call.name, call.arguments, {
              workspaceRoot: this.workspaceRoot,
              onStdout: (out) => {
                this.emit("tool_call_output", { callId, toolName: call.name, output: out });
              },
              onStderr: (err) => {
                this.emit("tool_call_output", { callId, toolName: call.name, output: err, isStderr: true });
              },
              signal: options?.signal,
            });

            const durationMs = Date.now() - startTime;
            toolsExecuted.push({ name: call.name, args: call.arguments, status: result.status });

            this.emit("tool_call_complete", {
              callId,
              toolName: call.name,
              result,
              durationMs,
              step: turnCount,
            });

            // Format Hermes 3 <tool_response>
            const toolResponsePayload = {
              name: call.name,
              status: result.status,
              output: result.output,
              data: result.data,
            };

            const toolResponseText = `<tool_response>\n${JSON.stringify(toolResponsePayload, null, 2)}\n</tool_response>`;

            messages.push({
              role: "tool",
              content: toolResponseText,
              name: call.name,
              tool_call_id: callId,
            });
          }

          this.emit("agent_step_end", { step: turnCount, hasMore: true });
          // Continue to next turn in the ReAct loop
          continue;
        }

        // If no tool calls, the model concluded its final response
        finalAnswer = parsed.cleanedContent || turnRawContent;
        messages.push({
          role: "assistant",
          content: finalAnswer,
        });

        this.emit("assistant_message", {
          content: finalAnswer,
          step: turnCount,
        });

        this.emit("agent_step_end", { step: turnCount, hasMore: false });

        // Save session summary to memory
        await this.memoryManager.addSessionSummary(
          userPrompt.substring(0, 100),
          finalAnswer.substring(0, 200),
          toolsExecuted.map(t => t.name)
        );

        const loopResult: HermesLoopResult = {
          success: true,
          finalAnswer,
          totalTurns: turnCount,
          allThoughts,
          toolsExecuted,
          messages,
        };

        this.emit("agent_complete", loopResult);
        return loopResult;

      } catch (err: any) {
        this.emit("agent_error", { error: err.message, step: turnCount });

        // If user cancelled via signal
        if (options?.signal?.aborted) {
          return {
            success: false,
            finalAnswer: "Task aborted by user.",
            totalTurns: turnCount,
            allThoughts,
            toolsExecuted,
            messages,
            error: "Aborted",
          };
        }

        throw err;
      }
    }

    // Hit max turns
    const timeoutMsg = `Agent reached maximum turn limit of ${maxTurns} steps without concluding.`;
    this.emit("agent_timeout", { maxTurns });

    return {
      success: false,
      finalAnswer: timeoutMsg,
      totalTurns: turnCount,
      allThoughts,
      toolsExecuted,
      messages,
      error: timeoutMsg,
    };
  }

  /**
   * Handles `/learn <skill_name> <instructions>` command synthesis
   */
  private async handleLearnCommand(prompt: string): Promise<HermesLoopResult> {
    const parts = prompt.replace(/^\/learn\s*/, "").trim();
    const firstSpace = parts.indexOf(" ");
    let skillName = "custom_skill";
    let instructions = parts;

    if (firstSpace !== -1) {
      skillName = parts.substring(0, firstSpace).trim();
      instructions = parts.substring(firstSpace).trim();
    } else if (parts.length > 0) {
      skillName = parts;
      instructions = `Skill procedure for ${parts}`;
    }

    const description = `Procedural skill for ${skillName} synthesized by Free Gravity`;
    const savedSkill = await this.memoryManager.saveSkill(skillName, description, instructions);

    const message = [
      `### Skill Successfully Synthesized: /${savedSkill.name}`,
      `**Description**: ${savedSkill.description}`,
      `**Stored at**: \`${savedSkill.filePath}\``,
      ``,
      `This skill has been indexed into workspace memory and will automatically be incorporated into all future Free Gravity Hermes sessions.`,
    ].join("\n");

    this.emit("skill_learned", { skillName: savedSkill.name, filePath: savedSkill.filePath });
    this.emit("assistant_message", { content: message, step: 1 });

    return {
      success: true,
      finalAnswer: message,
      totalTurns: 1,
      allThoughts: ["Processed /learn command and synthesized persistent skill."],
      toolsExecuted: [],
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: message },
      ],
    };
  }
}

// Singleton helper instance
export const defaultAgent = new HermesAgentLoop();
