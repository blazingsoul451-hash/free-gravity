/**
 * Free Gravity - Defensive ChatML & Tool Call Parser
 * 
 * Robust, self-healing parser for Nous Hermes 3 ChatML outputs:
 * - Extracts <thought>...</thought> blocks (even when wrapped in markdown code fences)
 * - Extracts <tool_call>{"name": "...", "arguments": {...}}</tool_call>
 * - Auto-balances unclosed JSON quotes, brackets, and braces
 * - Validates tool call schemas and generates structured 1-turn self-correction
 *   <tool_response> payloads to prevent broken agent sessions.
 */

export interface ParsedToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  raw: string;
  isValid: boolean;
  validationError?: string;
  correctionResponse?: string;
}

export interface ValidationError {
  toolName?: string;
  issue: string;
  rawCall: string;
  expectedSchema?: Record<string, any>;
}

export interface ParsedHermesOutput {
  thoughts: string[];
  toolCalls: ParsedToolCall[];
  cleanedContent: string;
  hasToolCalls: boolean;
  hasThoughts: boolean;
  validationErrors: ValidationError[];
  correctionResponses: string[];
}

export interface ToolParameterSchema {
  type: "string" | "number" | "boolean" | "object" | "array" | "any";
  description?: string;
  enum?: string[];
  required?: boolean;
  properties?: Record<string, ToolParameterSchema>;
  items?: ToolParameterSchema;
}

export interface ToolSchemaDefinition {
  name: string;
  description?: string;
  parameters?: {
    type?: string;
    properties?: Record<string, ToolParameterSchema>;
    required?: string[];
  };
}

export interface ToolRegistryLike {
  getToolSchema(name: string): ToolSchemaDefinition | undefined;
  hasTool(name: string): boolean;
}

/**
 * Generates a random unique ID for tool call tracking
 */
export function generateCallId(prefix = "call_"): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}_${rand}`;
}

/**
 * Cleans code fences and markdown wrappers from a snippet
 */
export function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  // Strip opening ```xml, ```json, ``` or similar
  cleaned = cleaned.replace(/^```(?:[a-zA-Z0-9_\-]+)?\r?\n?/, "");
  // Strip trailing ```
  cleaned = cleaned.replace(/\r?\n?```\s*$/, "");
  return cleaned.trim();
}

/**
 * Normalizes unicode smart quotes and dashes to standard ASCII
 */
export function normalizeSmartQuotes(str: string): string {
  return str
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u2013\u2014]/g, "-");
}

/**
 * Repairs broken/malformed JSON strings often emitted by LLMs
 * - Handles unclosed quotes
 * - Balances mismatched or unclosed braces/brackets
 * - Fixes trailing commas
 * - Fixes unquoted keys
 * - Strips JS/C-style comments
 * - Handles Python-style booleans/None
 */
export function balanceAndRepairJson(raw: string): { success: boolean; data: any; repairedString: string; error?: string } {
  if (!raw || typeof raw !== "string") {
    return { success: false, data: null, repairedString: "", error: "Input is empty or not a string" };
  }

  let text = stripCodeFences(raw.trim());
  text = normalizeSmartQuotes(text);

  // Fast path: try native JSON.parse first
  try {
    const data = JSON.parse(text);
    return { success: true, data, repairedString: text };
  } catch {
    // Proceed to repair
  }

  // 1. Isolate the candidate JSON object or array bounds
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  let startIdx = -1;

  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx !== -1) {
    text = text.substring(startIdx);
  }

  // 2. Strip single-line (//) and multi-line (/* */) comments while being careful outside strings
  text = text.replace(/\/\*[\s\S]*?\*\//g, "");
  text = text.replace(/(^|[^\\:])\/\/.*$/gm, "$1");

  // 3. Fix Python-style constants
  text = text.replace(/:\s*True\b/g, ": true");
  text = text.replace(/:\s*False\b/g, ": false");
  text = text.replace(/:\s*None\b/g, ": null");
  text = text.replace(/:\s*undefined\b/g, ": null");
  text = text.replace(/:\s*NaN\b/g, ": null");

  // 4. Fix single-quoted JSON properties and string values
  // Replace 'value' with "value" where appropriate, keeping escaped inner quotes intact
  text = text.replace(/([{,]\s*)'([^'\\]*(?:\\.[^'\\]*)*)'\s*:/g, '$1"$2":');
  text = text.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ':"$1"');

  // 5. Quote unquoted keys (e.g. { name: "test", cmd: 123 })
  text = text.replace(/([{\s,])([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/g, '$1"$2":');

  // 6. Fix unescaped control newlines inside string literals
  // Walk character-by-character to properly repair unclosed strings & balance brackets
  const openStack: string[] = [];
  let inString = false;
  let stringChar = '"';
  let isEscaped = false;
  let repaired = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (isEscaped) {
        repaired += char;
        isEscaped = false;
      } else if (char === "\\") {
        repaired += char;
        isEscaped = true;
      } else if (char === stringChar) {
        inString = false;
        repaired += char;
      } else if (char === "\n") {
        // Unescaped newline inside string -> replace with escaped \n
        repaired += "\\n";
      } else if (char === "\r") {
        // Ignore carriage return
      } else if (char === "\t") {
        repaired += "\\t";
      } else {
        repaired += char;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = '"'; // Normalize to double quote
        repaired += '"';
      } else if (char === "{") {
        openStack.push("}");
        repaired += char;
      } else if (char === "[") {
        openStack.push("]");
        repaired += char;
      } else if (char === "}" || char === "]") {
        if (openStack.length > 0 && openStack[openStack.length - 1] === char) {
          openStack.pop();
          repaired += char;
        } else if (openStack.includes(char)) {
          // Close whatever is in between
          while (openStack.length > 0) {
            const top = openStack.pop();
            repaired += top;
            if (top === char) break;
          }
        } else {
          // Stray closing bracket, skip or keep if stack empty
          repaired += char;
        }
      } else {
        repaired += char;
      }
    }
  }

  // If still inside string at EOF, close the string
  if (inString) {
    repaired += '"';
  }

  // 7. Remove trailing commas before closing braces/brackets: `, }` -> `}`
  repaired = repaired.replace(/,\s*([}\]])/g, "$1");

  // 8. Auto-balance any remaining open brackets/braces from the stack
  while (openStack.length > 0) {
    const closing = openStack.pop();
    repaired += closing;
  }

  // 9. Attempt parsing the repaired string
  try {
    const data = JSON.parse(repaired);
    return { success: true, data, repairedString: repaired };
  } catch (err: any) {
    // Final heuristic fallback: attempt to extract "name" and "arguments" via targeted regex
    const nameMatch = repaired.match(/"name"\s*:\s*"([^"]+)"/);
    if (nameMatch) {
      const extractedName = nameMatch[1];
      const argsMatch = repaired.match(/"arguments"\s*:\s*(\{[\s\S]*\})/);
      let extractedArgs: Record<string, any> = {};

      if (argsMatch) {
        try {
          extractedArgs = JSON.parse(argsMatch[1]);
          return {
            success: true,
            data: { name: extractedName, arguments: extractedArgs },
            repairedString: JSON.stringify({ name: extractedName, arguments: extractedArgs }),
          };
        } catch {
          // Keep fallback
        }
      }

      return {
        success: true,
        data: { name: extractedName, arguments: extractedArgs },
        repairedString: JSON.stringify({ name: extractedName, arguments: extractedArgs }),
      };
    }

    return {
      success: false,
      data: null,
      repairedString: repaired,
      error: `JSON parse failed after repair: ${err.message}`,
    };
  }
}

/**
 * Extracts <thought>...</thought> blocks from text
 * Handles:
 * - Direct <thought> blocks
 * - Fenced ```xml <thought> blocks
 * - Unclosed <thought> at the end of output (streaming cutoffs)
 */
export function extractThoughts(rawContent: string): { thoughts: string[]; cleanedContent: string } {
  const thoughts: string[] = [];
  let cleaned = rawContent;

  // Regex for closed <thought>...</thought> (case-insensitive, multiline)
  const closedThoughtRegex = /<thought>([\s\S]*?)<\/thought>/gi;
  cleaned = cleaned.replace(closedThoughtRegex, (_, content) => {
    const trimmed = content.trim();
    if (trimmed) thoughts.push(trimmed);
    return "";
  });

  // Regex for unclosed <thought> at EOF
  const unclosedThoughtRegex = /<thought>([\s\S]*)$/gi;
  cleaned = cleaned.replace(unclosedThoughtRegex, (_, content) => {
    const trimmed = content.trim();
    if (trimmed) thoughts.push(trimmed);
    return "";
  });

  // Also clean up any loose markdown blocks containing only thought tags
  cleaned = cleaned.replace(/```(?:xml|text)?\s*<\/thought>\s*```/gi, "");
  cleaned = cleaned.replace(/```(?:xml|text)?\s*<thought>\s*```/gi, "");

  return {
    thoughts,
    cleanedContent: cleaned.trim(),
  };
}

/**
 * Generates a structured 1-turn self-correction <tool_response> payload
 * Hermes 3 agents consume this format directly to recover from errors without session termination.
 */
export function generateCorrectionToolResponse(
  toolName: string,
  errorMessage: string,
  expectedSchema?: Record<string, any>
): string {
  const payload = {
    name: toolName || "unknown_tool",
    status: "error",
    error: errorMessage,
    expected_schema: expectedSchema || null,
    correction_instruction: `Your previous tool call failed validation: ${errorMessage}. Please correct your arguments adhering to the expected schema and reissue the <tool_call>.`,
  };

  return `<tool_response>\n${JSON.stringify(payload, null, 2)}\n</tool_response>`;
}

/**
 * Validates a parsed tool call object against an optional tool registry or schema
 */
export function validateToolCall(
  call: { name?: unknown; arguments?: unknown; raw: string },
  registry?: ToolRegistryLike
): { isValid: boolean; error?: string; expectedSchema?: Record<string, any>; normalizedArgs: Record<string, any> } {
  if (!call.name || typeof call.name !== "string" || call.name.trim() === "") {
    return {
      isValid: false,
      error: "Tool call is missing a valid 'name' string property.",
      normalizedArgs: {},
    };
  }

  const toolName = call.name.trim();

  // Normalize arguments
  let args: Record<string, any> = {};
  if (call.arguments !== undefined && call.arguments !== null) {
    if (typeof call.arguments === "object" && !Array.isArray(call.arguments)) {
      args = call.arguments as Record<string, any>;
    } else if (typeof call.arguments === "string") {
      const parsed = balanceAndRepairJson(call.arguments);
      if (parsed.success && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
        args = parsed.data;
      } else {
        return {
          isValid: false,
          error: `Arguments for tool '${toolName}' must be a JSON object, but could not be parsed.`,
          normalizedArgs: {},
        };
      }
    } else {
      return {
        isValid: false,
        error: `Arguments for tool '${toolName}' must be a JSON object, received ${typeof call.arguments}.`,
        normalizedArgs: {},
      };
    }
  }

  // If a registry is provided, validate existence and required parameters
  if (registry) {
    if (!registry.hasTool(toolName)) {
      return {
        isValid: false,
        error: `Tool '${toolName}' is not recognized or not available in the active tool registry.`,
        normalizedArgs: args,
      };
    }

    const schema = registry.getToolSchema(toolName);
    if (schema?.parameters) {
      const { properties, required } = schema.parameters;

      // Check required arguments
      if (Array.isArray(required)) {
        for (const reqField of required) {
          if (args[reqField] === undefined || args[reqField] === null) {
            return {
              isValid: false,
              error: `Missing required argument '${reqField}' for tool '${toolName}'.`,
              expectedSchema: schema.parameters,
              normalizedArgs: args,
            };
          }
        }
      }

      // Check argument types if properties definition is present
      if (properties) {
        for (const [key, value] of Object.entries(args)) {
          const propDef = properties[key];
          if (propDef && propDef.type) {
            const actualType = Array.isArray(value) ? "array" : typeof value;
            if (propDef.type !== "any" && actualType !== propDef.type) {
              return {
                isValid: false,
                error: `Argument '${key}' for tool '${toolName}' expected type '${propDef.type}', but received '${actualType}'.`,
                expectedSchema: schema.parameters,
                normalizedArgs: args,
              };
            }
          }
        }
      }
    }
  }

  return {
    isValid: true,
    normalizedArgs: args,
  };
}

/**
 * Extracts all <tool_call> blocks from text
 * Handles:
 * - Standard <tool_call>...</tool_call>
 * - Fenced ```json <tool_call>... blocks
 * - Inside code fences: <tool_call>```json ... ```</tool_call>
 * - Unclosed <tool_call> blocks at EOF
 * - Fallback raw JSON tool calls
 */
export function extractToolCalls(
  content: string,
  registry?: ToolRegistryLike
): { toolCalls: ParsedToolCall[]; cleanedContent: string; validationErrors: ValidationError[]; correctionResponses: string[] } {
  const toolCalls: ParsedToolCall[] = [];
  const validationErrors: ValidationError[] = [];
  const correctionResponses: string[] = [];
  let cleaned = content;

  // Pattern 1: Closed <tool_call>...</tool_call>
  const closedCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  cleaned = cleaned.replace(closedCallRegex, (_, block) => {
    processToolCallBlock(block.trim(), toolCalls, validationErrors, correctionResponses, registry);
    return "";
  });

  // Pattern 2: Unclosed <tool_call> at end of text
  const unclosedCallRegex = /<tool_call>([\s\S]*)$/gi;
  cleaned = cleaned.replace(unclosedCallRegex, (_, block) => {
    processToolCallBlock(block.trim(), toolCalls, validationErrors, correctionResponses, registry);
    return "";
  });

  // Pattern 3: Fallback if no <tool_call> tags were used, but conversational output includes raw JSON tool call
  if (toolCalls.length === 0) {
    const rawJsonCallRegex = /```(?:json)?\s*(\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*\{[\s\S]*?\}\s*\})\s*```/gi;
    cleaned = cleaned.replace(rawJsonCallRegex, (_, jsonText) => {
      processToolCallBlock(jsonText.trim(), toolCalls, validationErrors, correctionResponses, registry);
      return "";
    });
  }

  return {
    toolCalls,
    cleanedContent: cleaned.trim(),
    validationErrors,
    correctionResponses,
  };
}

/**
 * Helper to parse, balance, and validate a single tool call string block
 */
function processToolCallBlock(
  rawBlock: string,
  toolCalls: ParsedToolCall[],
  validationErrors: ValidationError[],
  correctionResponses: string[],
  registry?: ToolRegistryLike
): void {
  if (!rawBlock) return;

  const repairResult = balanceAndRepairJson(rawBlock);
  const callId = generateCallId();

  if (!repairResult.success || !repairResult.data) {
    const errorMsg = repairResult.error || "Malformed JSON inside <tool_call> block";
    const correction = generateCorrectionToolResponse("unknown_tool", errorMsg);

    validationErrors.push({
      toolName: "unknown_tool",
      issue: errorMsg,
      rawCall: rawBlock,
    });
    correctionResponses.push(correction);

    toolCalls.push({
      id: callId,
      name: "unknown_tool",
      arguments: {},
      raw: rawBlock,
      isValid: false,
      validationError: errorMsg,
      correctionResponse: correction,
    });
    return;
  }

  const parsedData = repairResult.data;
  const toolName = typeof parsedData.name === "string" ? parsedData.name.trim() : "";
  const rawArguments = parsedData.arguments ?? parsedData.args ?? parsedData.parameters ?? {};

  const validation = validateToolCall({ name: toolName, arguments: rawArguments, raw: rawBlock }, registry);

  if (!validation.isValid) {
    const errorMsg = validation.error || "Schema validation failed";
    const correction = generateCorrectionToolResponse(toolName, errorMsg, validation.expectedSchema);

    validationErrors.push({
      toolName: toolName || "unknown_tool",
      issue: errorMsg,
      rawCall: rawBlock,
      expectedSchema: validation.expectedSchema,
    });
    correctionResponses.push(correction);

    toolCalls.push({
      id: callId,
      name: toolName || "unknown_tool",
      arguments: validation.normalizedArgs,
      raw: rawBlock,
      isValid: false,
      validationError: errorMsg,
      correctionResponse: correction,
    });
  } else {
    toolCalls.push({
      id: callId,
      name: toolName,
      arguments: validation.normalizedArgs,
      raw: rawBlock,
      isValid: true,
    });
  }
}

/**
 * Master parse function: parses Nous Hermes 3 ChatML output into thoughts, tool calls, and cleaned response
 */
export function parseHermesOutput(content: string, registry?: ToolRegistryLike): ParsedHermesOutput {
  if (!content || typeof content !== "string") {
    return {
      thoughts: [],
      toolCalls: [],
      cleanedContent: "",
      hasToolCalls: false,
      hasThoughts: false,
      validationErrors: [],
      correctionResponses: [],
    };
  }

  // 1. Extract thoughts
  const thoughtResult = extractThoughts(content);

  // 2. Extract tool calls from remaining content
  const toolResult = extractToolCalls(thoughtResult.cleanedContent, registry);

  return {
    thoughts: thoughtResult.thoughts,
    toolCalls: toolResult.toolCalls,
    cleanedContent: toolResult.cleanedContent,
    hasToolCalls: toolResult.toolCalls.length > 0,
    hasThoughts: thoughtResult.thoughts.length > 0,
    validationErrors: toolResult.validationErrors,
    correctionResponses: toolResult.correctionResponses,
  };
}

/**
 * Streaming thought accumulator for real-time WebSocket thought emission
 */
export class StreamingThoughtParser {
  private buffer = "";
  private inThought = false;
  private currentThought = "";

  public feed(chunk: string, callbacks: {
    onThoughtDelta?: (delta: string) => void;
    onThoughtComplete?: (thought: string) => void;
    onContentDelta?: (delta: string) => void;
  }): void {
    this.buffer += chunk;

    while (this.buffer.length > 0) {
      if (!this.inThought) {
        const thoughtStartIdx = this.buffer.indexOf("<thought>");
        if (thoughtStartIdx !== -1) {
          // Everything before <thought> is content
          const preContent = this.buffer.substring(0, thoughtStartIdx);
          if (preContent && callbacks.onContentDelta) {
            callbacks.onContentDelta(preContent);
          }
          this.inThought = true;
          this.currentThought = "";
          this.buffer = this.buffer.substring(thoughtStartIdx + "<thought>".length);
        } else {
          // If buffer ends with a prefix of '<thought>', hold onto it
          const possibleTagPrefix = "<thought>";
          let keepLen = 0;
          for (let len = 1; len < possibleTagPrefix.length; len++) {
            if (this.buffer.endsWith(possibleTagPrefix.substring(0, len))) {
              keepLen = len;
              break;
            }
          }
          const emitLen = this.buffer.length - keepLen;
          if (emitLen > 0) {
            const emitChunk = this.buffer.substring(0, emitLen);
            if (callbacks.onContentDelta) callbacks.onContentDelta(emitChunk);
            this.buffer = this.buffer.substring(emitLen);
          }
          break;
        }
      } else {
        // Inside thought: look for </thought>
        const thoughtEndIdx = this.buffer.indexOf("</thought>");
        if (thoughtEndIdx !== -1) {
          const delta = this.buffer.substring(0, thoughtEndIdx);
          this.currentThought += delta;
          if (delta && callbacks.onThoughtDelta) {
            callbacks.onThoughtDelta(delta);
          }
          if (callbacks.onThoughtComplete) {
            callbacks.onThoughtComplete(this.currentThought.trim());
          }
          this.inThought = false;
          this.currentThought = "";
          this.buffer = this.buffer.substring(thoughtEndIdx + "</thought>".length);
        } else {
          // Check for trailing partial tag
          const closeTag = "</thought>";
          let keepLen = 0;
          for (let len = 1; len < closeTag.length; len++) {
            if (this.buffer.endsWith(closeTag.substring(0, len))) {
              keepLen = len;
              break;
            }
          }
          const emitLen = this.buffer.length - keepLen;
          if (emitLen > 0) {
            const delta = this.buffer.substring(0, emitLen);
            this.currentThought += delta;
            if (callbacks.onThoughtDelta) callbacks.onThoughtDelta(delta);
            this.buffer = this.buffer.substring(emitLen);
          }
          break;
        }
      }
    }
  }

  public flush(callbacks: {
    onThoughtComplete?: (thought: string) => void;
    onContentDelta?: (delta: string) => void;
  }): void {
    if (this.inThought && this.currentThought.trim()) {
      if (callbacks.onThoughtComplete) {
        callbacks.onThoughtComplete(this.currentThought.trim());
      }
    } else if (!this.inThought && this.buffer) {
      if (callbacks.onContentDelta) {
        callbacks.onContentDelta(this.buffer);
      }
    }
    this.buffer = "";
    this.currentThought = "";
    this.inThought = false;
  }
}
