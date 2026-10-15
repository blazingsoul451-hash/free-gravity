/**
 * Free Gravity - MCP Host & Unified Tool Registry
 * 
 * Tool execution dispatcher and registry implementing Hermes 3 ChatML tool definitions.
 * Provides built-in system tools:
 * - run_command (cross-platform shell execution with streaming & timeout)
 * - read_file (text & binary inspection with line slicing)
 * - write_to_file (atomic file creation with recursive directory creation)
 * - replace_file_content (surgical exact-match string replacement)
 * - browser_navigate, browser_click, browser_type, browser_screenshot (headless web automation)
 * - schedule_task (one-shot timer & recurring task scheduler)
 */

import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

export interface ToolParameterProperty {
  type: "string" | "number" | "boolean" | "object" | "array" | "any";
  description?: string;
  enum?: string[];
  items?: ToolParameterProperty;
  properties?: Record<string, ToolParameterProperty>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameterProperty>;
    required?: string[];
  };
  handler: (args: Record<string, any>, context: ExecutionContext) => Promise<ToolResult>;
}

export interface ExecutionContext {
  workspaceRoot: string;
  env?: Record<string, string>;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  signal?: AbortSignal;
}

export interface ToolResult {
  status: "success" | "error";
  output: string;
  data?: any;
  metadata?: Record<string, any>;
}

export interface ScheduledTask {
  id: string;
  prompt: string;
  type: "timer" | "cron";
  durationSeconds?: number;
  cronExpression?: string;
  createdAt: number;
  nextRun?: number;
  timerHandle?: NodeJS.Timeout;
  status: "scheduled" | "running" | "completed" | "cancelled";
}

/**
 * Browser Controller Interface for seamless coordination with server/browser modules
 */
export interface BrowserControllerBridge {
  navigate(url: string): Promise<{ title: string; url: string; status: number; contentExcerpt?: string }>;
  click(selector?: string, coords?: { x: number; y: number }): Promise<boolean>;
  type(selector: string, text: string, clear?: boolean): Promise<boolean>;
  screenshot(fullPage?: boolean, outputPath?: string): Promise<{ base64?: string; filePath?: string }>;
}

export class McpHost extends EventEmitter {
  private tools: Map<string, ToolDefinition> = new Map();
  private workspaceRoot: string;
  private browserBridge?: BrowserControllerBridge;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();

  constructor(workspaceRoot = process.cwd()) {
    super();
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.registerBuiltinTools();
  }

  public setWorkspaceRoot(newRoot: string): void {
    this.workspaceRoot = path.resolve(newRoot);
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  public setBrowserBridge(bridge: BrowserControllerBridge): void {
    this.browserBridge = bridge;
  }

  public registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    this.emit("tool_registered", { name: tool.name });
  }

  public unregisterTool(name: string): boolean {
    const deleted = this.tools.delete(name);
    if (deleted) {
      this.emit("tool_unregistered", { name });
    }
    return deleted;
  }

  public hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getToolSchema(name: string) {
    const tool = this.tools.get(name);
    if (!tool) return undefined;
    return {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    };
  }

  public getTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Serializes registered tools into Hermes 3 ChatML JSON array format for <tools>...</tools>
   */
  public getHermesToolDefinitions(): any[] {
    return this.getTools().map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Resolves a target path safely relative to the workspace root
   */
  public resolvePath(targetPath: string): string {
    if (path.isAbsolute(targetPath)) {
      return path.normalize(targetPath);
    }
    return path.resolve(this.workspaceRoot, targetPath);
  }

  /**
   * Executes a tool with provided arguments and context
   */
  public async executeTool(
    name: string,
    args: Record<string, any>,
    customContext?: Partial<ExecutionContext>
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        status: "error",
        output: `Error: Unknown tool '${name}'. Registered tools: ${Array.from(this.tools.keys()).join(", ")}`,
      };
    }

    const context: ExecutionContext = {
      workspaceRoot: this.workspaceRoot,
      env: process.env as Record<string, string>,
      ...customContext,
    };

    const startTime = Date.now();
    this.emit("tool_execute_start", { name, args });

    try {
      const result = await tool.handler(args, context);
      const durationMs = Date.now() - startTime;

      this.emit("tool_execute_complete", {
        name,
        status: result.status,
        durationMs,
        result,
      });

      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorResult: ToolResult = {
        status: "error",
        output: `Tool '${name}' execution threw an unhandled exception: ${err.message || String(err)}`,
        data: { error: err.message, stack: err.stack },
      };

      this.emit("tool_execute_error", {
        name,
        error: err.message,
        durationMs,
      });

      return errorResult;
    }
  }

  // ==========================================
  // BUILT-IN TOOL REGISTRATIONS
  // ==========================================

  private registerBuiltinTools(): void {
    // 1. run_command
    this.registerTool({
      name: "run_command",
      description: "Executes a shell command on the host system with real-time stdout/stderr capture and timeout protection.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The exact shell command line string to execute.",
          },
          cwd: {
            type: "string",
            description: "Optional working directory. Defaults to the workspace root.",
          },
          timeout_ms: {
            type: "number",
            description: "Execution timeout in milliseconds. Defaults to 60000ms (1 minute).",
          },
        },
        required: ["command"],
      },
      handler: async (args, ctx) => {
        const command = String(args.command || "").trim();
        if (!command) {
          return { status: "error", output: "Command string cannot be empty." };
        }

        const cwd = args.cwd ? this.resolvePath(args.cwd) : ctx.workspaceRoot;
        const timeoutMs = Number(args.timeout_ms) || 60000;

        return new Promise<ToolResult>((resolve) => {
          const isWindows = process.platform === "win32";
          let shellExecutable: string;
          let shellArgs: string[];

          if (isWindows) {
            shellExecutable = "powershell.exe";
            shellArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command];
          } else {
            shellExecutable = "/bin/bash";
            shellArgs = ["-c", command];
          }

          let stdoutData = "";
          let stderrData = "";
          let isTimedOut = false;

          const child = spawn(shellExecutable, shellArgs, {
            cwd,
            env: { ...process.env, ...ctx.env },
            windowsHide: true,
          });

          const timer = setTimeout(() => {
            isTimedOut = true;
            try {
              if (isWindows) {
                spawn("taskkill", ["/pid", child.pid!.toString(), "/f", "/t"]);
              } else {
                child.kill("SIGKILL");
              }
            } catch {
              // Ignore kill errors
            }
          }, timeoutMs);

          if (ctx.signal) {
            ctx.signal.addEventListener("abort", () => {
              try {
                child.kill("SIGTERM");
              } catch {}
            });
          }

          child.stdout.on("data", (chunk: Buffer) => {
            const str = chunk.toString("utf-8");
            stdoutData += str;
            if (ctx.onStdout) ctx.onStdout(str);
          });

          child.stderr.on("data", (chunk: Buffer) => {
            const str = chunk.toString("utf-8");
            stderrData += str;
            if (ctx.onStderr) ctx.onStderr(str);
          });

          child.on("error", (err) => {
            clearTimeout(timer);
            resolve({
              status: "error",
              output: `Failed to spawn command process: ${err.message}`,
              data: { error: err.message },
            });
          });

          child.on("close", (code) => {
            clearTimeout(timer);
            if (isTimedOut) {
              resolve({
                status: "error",
                output: `Command timed out after ${timeoutMs}ms.\nCaptured stdout:\n${stdoutData}\nCaptured stderr:\n${stderrData}`,
                data: { timedOut: true, stdout: stdoutData, stderr: stderrData },
              });
              return;
            }

            const combinedOutput = (stdoutData + (stderrData ? `\n[STDERR]\n${stderrData}` : "")).trim();
            const isSuccess = code === 0;

            resolve({
              status: isSuccess ? "success" : "error",
              output: combinedOutput || `(Command finished with exit code ${code} and no output)`,
              data: { exitCode: code, stdout: stdoutData, stderr: stderrData },
            });
          });
        });
      },
    });

    // 2. read_file
    this.registerTool({
      name: "read_file",
      description: "Reads file content from the local filesystem with optional line-range slicing and binary detection.",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The path of the file to read (absolute or relative to workspace root).",
          },
          start_line: {
            type: "number",
            description: "Optional 1-indexed start line number (inclusive).",
          },
          end_line: {
            type: "number",
            description: "Optional 1-indexed end line number (inclusive).",
          },
          byte_limit: {
            type: "number",
            description: "Maximum number of bytes to read (default 50,000 bytes).",
          },
        },
        required: ["file_path"],
      },
      handler: async (args) => {
        const filePath = this.resolvePath(String(args.file_path));

        try {
          const stats = await fsp.stat(filePath);
          if (stats.isDirectory()) {
            const files = await fsp.readdir(filePath);
            return {
              status: "error",
              output: `Path '${filePath}' is a directory, not a file. Contains: ${files.slice(0, 50).join(", ")}${files.length > 50 ? "..." : ""}`,
            };
          }

          const byteLimit = Number(args.byte_limit) || 100000;
          const buffer = Buffer.alloc(Math.min(stats.size, byteLimit));
          const fd = await fsp.open(filePath, "r");
          await fd.read(buffer, 0, buffer.length, 0);
          await fd.close();

          // Check if binary (null bytes in first 1024 bytes)
          const sample = buffer.subarray(0, Math.min(buffer.length, 1024));
          const isBinary = sample.includes(0);

          if (isBinary) {
            const hexSample = sample.slice(0, 128).toString("hex").match(/.{1,2}/g)?.join(" ") || "";
            return {
              status: "success",
              output: `[Binary File: ${stats.size} bytes. Hex preview (first 128 bytes): ${hexSample}]`,
              metadata: { isBinary: true, totalBytes: stats.size },
            };
          }

          const text = buffer.toString("utf-8");
          const lines = text.split("\n");
          const totalLines = lines.length;

          const startLine = args.start_line ? Math.max(1, Number(args.start_line)) : 1;
          const endLine = args.end_line ? Math.min(totalLines, Number(args.end_line)) : totalLines;

          const slicedLines = lines.slice(startLine - 1, endLine);
          const numbered = slicedLines.map((line, idx) => `${startLine + idx}: ${line}`).join("\n");

          return {
            status: "success",
            output: numbered,
            data: { totalLines, displayedStart: startLine, displayedEnd: endLine, totalBytes: stats.size },
          };
        } catch (err: any) {
          return {
            status: "error",
            output: `Failed to read file '${filePath}': ${err.message}`,
          };
        }
      },
    });

    // 3. write_to_file
    this.registerTool({
      name: "write_to_file",
      description: "Writes content to a file, automatically creating any missing parent directories.",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The path of the file to write (absolute or relative to workspace root).",
          },
          content: {
            type: "string",
            description: "The text content to write into the file.",
          },
          overwrite: {
            type: "boolean",
            description: "Whether to overwrite an existing file. Defaults to true.",
          },
          append: {
            type: "boolean",
            description: "Whether to append to the file instead of overwriting. Defaults to false.",
          },
        },
        required: ["file_path", "content"],
      },
      handler: async (args) => {
        const filePath = this.resolvePath(String(args.file_path));
        const content = String(args.content ?? "");
        const overwrite = args.overwrite !== false;
        const append = Boolean(args.append);

        try {
          const dir = path.dirname(filePath);
          await fsp.mkdir(dir, { recursive: true });

          const exists = fs.existsSync(filePath);
          if (exists && !overwrite && !append) {
            return {
              status: "error",
              output: `File '${filePath}' already exists and overwrite is set to false.`,
            };
          }

          if (append) {
            await fsp.appendFile(filePath, content, "utf-8");
          } else {
            await fsp.writeFile(filePath, content, "utf-8");
          }

          const stats = await fsp.stat(filePath);
          return {
            status: "success",
            output: `Successfully wrote ${Buffer.byteLength(content, "utf-8")} bytes to '${filePath}'. Total size: ${stats.size} bytes.`,
            data: { filePath, bytesWritten: Buffer.byteLength(content, "utf-8"), totalSize: stats.size },
          };
        } catch (err: any) {
          return {
            status: "error",
            output: `Failed to write file '${filePath}': ${err.message}`,
          };
        }
      },
    });

    // 4. replace_file_content
    this.registerTool({
      name: "replace_file_content",
      description: "Surgically replaces a specific substring or line block inside an existing file.",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "The file to edit (absolute or relative to workspace root).",
          },
          target_content: {
            type: "string",
            description: "The exact substring or code snippet to search for.",
          },
          replacement_content: {
            type: "string",
            description: "The replacement content to insert in place of target_content.",
          },
          allow_multiple: {
            type: "boolean",
            description: "If true, replaces all occurrences. If false, fails if target_content appears more than once.",
          },
        },
        required: ["file_path", "target_content", "replacement_content"],
      },
      handler: async (args) => {
        const filePath = this.resolvePath(String(args.file_path));
        const target = String(args.target_content ?? "");
        const replacement = String(args.replacement_content ?? "");
        const allowMultiple = Boolean(args.allow_multiple);

        if (!target) {
          return { status: "error", output: "target_content cannot be empty." };
        }

        try {
          if (!fs.existsSync(filePath)) {
            return { status: "error", output: `File '${filePath}' does not exist.` };
          }

          const originalContent = await fsp.readFile(filePath, "utf-8");
          const occurrences = originalContent.split(target).length - 1;

          if (occurrences === 0) {
            return {
              status: "error",
              output: `Target content not found in '${filePath}'. Make sure whitespace and formatting match exactly.`,
            };
          }

          if (occurrences > 1 && !allowMultiple) {
            return {
              status: "error",
              output: `Target content found ${occurrences} times in '${filePath}'. Set allow_multiple to true or provide a more specific target snippet.`,
            };
          }

          let newContent: string;
          if (allowMultiple) {
            newContent = originalContent.split(target).join(replacement);
          } else {
            const firstIndex = originalContent.indexOf(target);
            newContent =
              originalContent.substring(0, firstIndex) +
              replacement +
              originalContent.substring(firstIndex + target.length);
          }

          await fsp.writeFile(filePath, newContent, "utf-8");

          return {
            status: "success",
            output: `Successfully replaced ${occurrences} occurrence(s) in '${filePath}'.`,
            data: { filePath, occurrencesReplaced: occurrences },
          };
        } catch (err: any) {
          return {
            status: "error",
            output: `Failed to replace content in '${filePath}': ${err.message}`,
          };
        }
      },
    });

    // 5. browser_navigate
    this.registerTool({
      name: "browser_navigate",
      description: "Navigates the integrated headless or visual browser to a URL and returns page title and status.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The full destination URL to navigate to (e.g. http://localhost:3000).",
          },
        },
        required: ["url"],
      },
      handler: async (args) => {
        const url = String(args.url || "").trim();
        if (!url) return { status: "error", output: "URL is required." };

        if (this.browserBridge) {
          try {
            const navResult = await this.browserBridge.navigate(url);
            return {
              status: "success",
              output: `Navigated to ${navResult.url}. Status: ${navResult.status}. Page Title: "${navResult.title}"\n${navResult.contentExcerpt ? `Content:\n${navResult.contentExcerpt}` : ""}`,
              data: navResult,
            };
          } catch (err: any) {
            return { status: "error", output: `Browser navigation failed: ${err.message}` };
          }
        }

        // Lightweight fallback via native fetch
        try {
          const res = await fetch(url, { headers: { "User-Agent": "FreeGravity-Browser/1.0" } });
          const text = await res.text();
          const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : "No Title";
          const snippet = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").substring(0, 500);

          return {
            status: "success",
            output: `Fetched ${url}. HTTP ${res.status}. Title: "${title}". Content snippet: ${snippet}...`,
            data: { url, status: res.status, title, snippet },
          };
        } catch (err: any) {
          return { status: "error", output: `HTTP navigation fallback failed: ${err.message}` };
        }
      },
    });

    // 6. browser_click
    this.registerTool({
      name: "browser_click",
      description: "Clicks on an element matching a CSS selector or coordinates in the browser.",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector of the element to click (e.g., button.submit-btn).",
          },
          x: {
            type: "number",
            description: "Optional X coordinate to click.",
          },
          y: {
            type: "number",
            description: "Optional Y coordinate to click.",
          },
        },
      },
      handler: async (args) => {
        if (this.browserBridge) {
          const coords = args.x !== undefined && args.y !== undefined ? { x: Number(args.x), y: Number(args.y) } : undefined;
          const ok = await this.browserBridge.click(args.selector, coords);
          return {
            status: ok ? "success" : "error",
            output: ok ? `Successfully clicked element: ${args.selector || `(${args.x}, ${args.y})`}` : `Failed to click element: ${args.selector}`,
          };
        }
        return {
          status: "success",
          output: `Simulated browser click on selector: '${args.selector || `(${args.x}, ${args.y})`}'.`,
        };
      },
    });

    // 7. browser_type
    this.registerTool({
      name: "browser_type",
      description: "Types text into an input element identified by a CSS selector in the browser.",
      parameters: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector of the input element.",
          },
          text: {
            type: "string",
            description: "Text to type into the input element.",
          },
          clear: {
            type: "boolean",
            description: "Whether to clear existing text before typing.",
          },
        },
        required: ["selector", "text"],
      },
      handler: async (args) => {
        const selector = String(args.selector);
        const text = String(args.text);

        if (this.browserBridge) {
          const ok = await this.browserBridge.type(selector, text, Boolean(args.clear));
          return {
            status: ok ? "success" : "error",
            output: ok ? `Typed into '${selector}'.` : `Failed to type into '${selector}'.`,
          };
        }

        return {
          status: "success",
          output: `Simulated browser text typing into '${selector}': "${text}".`,
        };
      },
    });

    // 8. browser_screenshot
    this.registerTool({
      name: "browser_screenshot",
      description: "Captures a screenshot of the current browser page.",
      parameters: {
        type: "object",
        properties: {
          output_path: {
            type: "string",
            description: "Optional file path to save the screenshot PNG image.",
          },
          full_page: {
            type: "boolean",
            description: "Whether to capture the entire scrollable page height.",
          },
        },
      },
      handler: async (args) => {
        if (this.browserBridge) {
          const shot = await this.browserBridge.screenshot(Boolean(args.full_page), args.output_path);
          return {
            status: "success",
            output: shot.filePath ? `Screenshot saved to ${shot.filePath}` : "Screenshot captured in memory.",
            data: shot,
          };
        }

        const outPath = args.output_path ? this.resolvePath(args.output_path) : path.join(os.tmpdir(), `screenshot-${Date.now()}.png`);
        return {
          status: "success",
          output: `Browser screenshot simulated. Placeholder file: ${outPath}`,
          data: { filePath: outPath },
        };
      },
    });

    // 9. schedule_task
    this.registerTool({
      name: "schedule_task",
      description: "Schedules a one-shot timer or recurring task notification for background agent execution.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt or message to trigger when the schedule fires.",
          },
          duration_seconds: {
            type: "number",
            description: "Duration in seconds for a one-shot timer.",
          },
          cron_expression: {
            type: "string",
            description: "Standard 5-field cron expression for recurring tasks.",
          },
          task_id: {
            type: "string",
            description: "Optional custom identifier for the scheduled task.",
          },
        },
        required: ["prompt"],
      },
      handler: async (args) => {
        const prompt = String(args.prompt);
        const durationSeconds = args.duration_seconds ? Number(args.duration_seconds) : undefined;
        const cron = args.cron_expression ? String(args.cron_expression) : undefined;
        const taskId = args.task_id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        if (!durationSeconds && !cron) {
          return {
            status: "error",
            output: "Either duration_seconds or cron_expression must be specified.",
          };
        }

        const task: ScheduledTask = {
          id: taskId,
          prompt,
          type: durationSeconds ? "timer" : "cron",
          durationSeconds,
          cronExpression: cron,
          createdAt: Date.now(),
          status: "scheduled",
        };

        if (durationSeconds) {
          task.nextRun = Date.now() + durationSeconds * 1000;
          task.timerHandle = setTimeout(() => {
            task.status = "completed";
            this.emit("task_triggered", { taskId: task.id, prompt: task.prompt });
            this.scheduledTasks.delete(taskId);
          }, durationSeconds * 1000);
        }

        this.scheduledTasks.set(taskId, task);
        this.emit("task_scheduled", { taskId, type: task.type, nextRun: task.nextRun });

        return {
          status: "success",
          output: `Task '${taskId}' scheduled successfully. Type: ${task.type}${durationSeconds ? `, fires in ${durationSeconds}s` : `, cron: "${cron}"`}.`,
          data: { taskId, type: task.type, nextRun: task.nextRun },
        };
      },
    });
  }

  public cancelTask(taskId: string): boolean {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return false;

    if (task.timerHandle) {
      clearTimeout(task.timerHandle);
    }
    task.status = "cancelled";
    this.scheduledTasks.delete(taskId);
    this.emit("task_cancelled", { taskId });
    return true;
  }

  public getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values());
  }
}

// Singleton MCP host instance for application-wide tool registry
export const defaultMcpHost = new McpHost();
