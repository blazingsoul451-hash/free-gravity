/**
 * Free Gravity - REA Skill Pack (morluto/rea: Reverse Engineer Anything)
 * 
 * Specialized reverse engineering capabilities for Free Gravity:
 * - Binary & Hex inspection with standard canonical hexdump formatting
 * - Magic byte file signature detection (PE/EXE, ELF, Mach-O, ZIP, SQLite, etc.)
 * - ASCII & UTF-16LE strings extractor with automatic category classification
 * - Shannon entropy calculations (detecting encryption, compression, and packing)
 * - Network payload & token analysis (JWT decoding, Base64/Hex unmasking, HTTP wire)
 * - Clean-room code reconstruction workflows and specialized REA system prompts
 */

import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { McpHost } from "./mcp-host.js";

/**
 * Known file signatures and magic numbers
 */
export interface FileSignature {
  name: string;
  category: "executable" | "archive" | "image" | "document" | "database" | "bytecode" | "unknown";
  description: string;
  matches: (buf: Buffer) => boolean;
}

export const KNOWN_SIGNATURES: FileSignature[] = [
  {
    name: "Windows PE Executable / DLL",
    category: "executable",
    description: "Microsoft Windows Portable Executable (EXE, DLL, SYS, OCX)",
    matches: (b) => b.length >= 2 && b[0] === 0x4d && b[1] === 0x5a, // MZ
  },
  {
    name: "Linux ELF Executable / Library",
    category: "executable",
    description: "Executable and Linkable Format (Linux/BSD/Android ELF)",
    matches: (b) => b.length >= 4 && b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46, // \x7fELF
  },
  {
    name: "macOS Mach-O (32-bit / 64-bit)",
    category: "executable",
    description: "Apple Mach-O Binary (macOS/iOS/watchOS)",
    matches: (b) => {
      if (b.length < 4) return false;
      const magic = b.readUInt32BE(0);
      return magic === 0xfeedface || magic === 0xfeedfacf || magic === 0xcefaedfe || magic === 0xcffaedfe;
    },
  },
  {
    name: "WebAssembly Binary (.wasm)",
    category: "bytecode",
    description: "Wasm binary module",
    matches: (b) => b.length >= 4 && b[0] === 0x00 && b[1] === 0x61 && b[2] === 0x73 && b[3] === 0x6d, // \0asm
  },
  {
    name: "Java Class File",
    category: "bytecode",
    description: "Compiled JVM bytecode",
    matches: (b) => b.length >= 4 && b[0] === 0xca && b[1] === 0xfe && b[2] === 0xba && b[3] === 0xbe, // CAFEBABE
  },
  {
    name: "Android Dalvik DEX",
    category: "bytecode",
    description: "Android Dalvik Executable file",
    matches: (b) => b.length >= 4 && b[0] === 0x64 && b[1] === 0x65 && b[2] === 0x78 && b[3] === 0x0a, // dex\n
  },
  {
    name: "ZIP Archive / JAR / APK",
    category: "archive",
    description: "Standard PKZip archive or derivative",
    matches: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05) && (b[3] === 0x04 || b[3] === 0x06), // PK..
  },
  {
    name: "GZIP Compressed Archive",
    category: "archive",
    description: "GNU zip compressed file",
    matches: (b) => b.length >= 2 && b[0] === 0x1f && b[1] === 0x8b,
  },
  {
    name: "7-Zip Archive",
    category: "archive",
    description: "7z LZMA compressed archive",
    matches: (b) => b.length >= 6 && b[0] === 0x37 && b[1] === 0x7a && b[2] === 0xbc && b[3] === 0xaf && b[4] === 0x27 && b[5] === 0x1c,
  },
  {
    name: "SQLite 3 Database",
    category: "database",
    description: "SQLite version 3 storage database",
    matches: (b) => b.length >= 16 && b.subarray(0, 16).toString("ascii").startsWith("SQLite format 3"),
  },
  {
    name: "PNG Image",
    category: "image",
    description: "Portable Network Graphics image",
    matches: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    name: "JPEG Image",
    category: "image",
    description: "Joint Photographic Experts Group image",
    matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    name: "PDF Document",
    category: "document",
    description: "Adobe Portable Document Format",
    matches: (b) => b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46, // %PDF
  },
];

/**
 * Detects the file type by inspecting magic header bytes
 */
export function detectFileType(buffer: Buffer): { name: string; category: string; description: string } {
  for (const sig of KNOWN_SIGNATURES) {
    if (sig.matches(buffer)) {
      return { name: sig.name, category: sig.category, description: sig.description };
    }
  }

  // Check if pure ASCII / UTF-8 text
  const checkLen = Math.min(buffer.length, 1024);
  let isText = true;
  for (let i = 0; i < checkLen; i++) {
    const byte = buffer[i];
    if (byte === 0 || (byte < 0x09 && byte !== 0x00) || (byte > 0x0d && byte < 0x20 && byte !== 0x1b)) {
      isText = false;
      break;
    }
  }

  if (isText) {
    return { name: "Plaintext / Source Code", category: "document", description: "ASCII or UTF-8 text file" };
  }

  return { name: "Unknown Binary", category: "unknown", description: "Unidentified binary data format" };
}

/**
 * Calculates Shannon Entropy of a buffer (0.0 to 8.0)
 * H(X) = -sum(P(x) * log2(P(x)))
 */
export function calculateShannonEntropy(buffer: Buffer): {
  entropy: number;
  rating: "sparse" | "code_or_text" | "dense_binary" | "packed_or_encrypted";
  description: string;
} {
  if (buffer.length === 0) {
    return { entropy: 0, rating: "sparse", description: "Empty buffer" };
  }

  const frequencies = new Uint32Array(256);
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }

  let entropy = 0;
  const total = buffer.length;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const p = frequencies[i] / total;
      entropy -= p * Math.log2(p);
    }
  }

  // Round to 3 decimal places
  entropy = Math.round(entropy * 1000) / 1000;

  if (entropy < 3.0) {
    return {
      entropy,
      rating: "sparse",
      description: "Low entropy: repetitive, zero-padded, or simple repetitive data.",
    };
  } else if (entropy < 6.0) {
    return {
      entropy,
      rating: "code_or_text",
      description: "Normal entropy: typical of source code, text, or uncompressed machine instructions.",
    };
  } else if (entropy < 7.2) {
    return {
      entropy,
      rating: "dense_binary",
      description: "High density: compiled machine code, structured tables, or lightweight compression.",
    };
  } else {
    return {
      entropy,
      rating: "packed_or_encrypted",
      description: "Critical entropy (>= 7.2): payload is likely encrypted, compressed (e.g. zlib/lzma), or packed.",
    };
  }
}

/**
 * Formats a buffer into canonical 16-bytes-per-line hexdump with ASCII sidebar
 */
export function formatHexDump(buffer: Buffer, startOffset = 0, length = 256): string {
  const actualLen = Math.min(buffer.length - startOffset, length);
  if (actualLen <= 0) return "(No data at specified offset)";

  const lines: string[] = [];
  const header = "  Offset    00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F  |ASCII Value     |";
  const separator = "  --------  -----------------------------------------------  |----------------|";
  lines.push(header, separator);

  for (let i = 0; i < actualLen; i += 16) {
    const chunkLen = Math.min(16, actualLen - i);
    const chunk = buffer.subarray(startOffset + i, startOffset + i + chunkLen);

    const offsetHex = (startOffset + i).toString(16).padStart(8, "0");

    let hexPart1 = "";
    let hexPart2 = "";
    let asciiPart = "";

    for (let j = 0; j < 16; j++) {
      if (j < chunkLen) {
        const byte = chunk[j];
        const hex = byte.toString(16).padStart(2, "0");
        if (j < 8) {
          hexPart1 += hex + " ";
        } else {
          hexPart2 += hex + " ";
        }
        // Printable ASCII is 0x20 to 0x7E
        asciiPart += (byte >= 0x20 && byte <= 0x7e) ? String.fromCharCode(byte) : ".";
      } else {
        if (j < 8) {
          hexPart1 += "   ";
        } else {
          hexPart2 += "   ";
        }
        asciiPart += " ";
      }
    }

    lines.push(`  ${offsetHex}  ${hexPart1} ${hexPart2} |${asciiPart}|`);
  }

  return lines.join("\n");
}

/**
 * Extracts printable ASCII and UTF-16LE strings from a buffer and classifies them
 */
export function extractStrings(
  buffer: Buffer,
  minLen = 4,
  maxCount = 150
): {
  totalFound: number;
  categories: {
    urls: string[];
    ips: string[];
    paths: string[];
    tokensAndKeys: string[];
    identifiers: string[];
    general: string[];
  };
} {
  const rawStrings: string[] = [];

  // 1. ASCII extraction
  let currentAscii = "";
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte >= 0x20 && byte <= 0x7e) {
      currentAscii += String.fromCharCode(byte);
    } else {
      if (currentAscii.length >= minLen) {
        rawStrings.push(currentAscii);
      }
      currentAscii = "";
    }
  }
  if (currentAscii.length >= minLen) {
    rawStrings.push(currentAscii);
  }

  // 2. UTF-16LE extraction (e.g. Windows WCHAR)
  let currentWide = "";
  for (let i = 0; i < buffer.length - 1; i += 2) {
    const b1 = buffer[i];
    const b2 = buffer[i + 1];
    if (b2 === 0x00 && b1 >= 0x20 && b1 <= 0x7e) {
      currentWide += String.fromCharCode(b1);
    } else {
      if (currentWide.length >= minLen) {
        rawStrings.push(currentWide);
      }
      currentWide = "";
    }
  }
  if (currentWide.length >= minLen) {
    rawStrings.push(currentWide);
  }

  // Deduplicate
  const unique = Array.from(new Set(rawStrings));

  // Categorize
  const urls: string[] = [];
  const ips: string[] = [];
  const paths: string[] = [];
  const tokensAndKeys: string[] = [];
  const identifiers: string[] = [];
  const general: string[] = [];

  const urlRegex = /^https?:\/\/[^\s"']+$/i;
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const pathRegex = /^(?:[a-zA-Z]:[\\\/]|\/)[a-zA-Z0-9_\-\.\/\\~]+$/;
  const tokenRegex = /^[a-zA-Z0-9_\-]{32,}$|^ey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/; // Hex/base64/JWT
  const identRegex = /^[a-zA-Z_][a-zA-Z0-9_]{3,}$/;

  for (const str of unique) {
    if (urlRegex.test(str)) {
      if (urls.length < 30) urls.push(str);
    } else if (ipRegex.test(str)) {
      if (ips.length < 20) ips.push(str);
    } else if (pathRegex.test(str)) {
      if (paths.length < 30) paths.push(str);
    } else if (tokenRegex.test(str)) {
      if (tokensAndKeys.length < 20) tokensAndKeys.push(str);
    } else if (identRegex.test(str)) {
      if (identifiers.length < 40) identifiers.push(str);
    } else {
      if (general.length < maxCount) general.push(str);
    }
  }

  return {
    totalFound: unique.length,
    categories: {
      urls,
      ips,
      paths,
      tokensAndKeys,
      identifiers,
      general: general.slice(0, maxCount),
    },
  };
}

/**
 * Analyzes network payloads, HTTP messages, and encoded tokens
 */
export function analyzePayload(payload: string): {
  type: string;
  decoded: any;
  jwtInfo?: any;
  extractedParameters?: Record<string, string>;
  findings: string[];
} {
  const trimmed = payload.trim();
  const findings: string[] = [];

  // Check if JWT (3 dot-separated base64url parts)
  const jwtMatch = trimmed.match(/^(ey[a-zA-Z0-9_-]+)\.(ey[a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/);
  if (jwtMatch) {
    try {
      const headerJson = Buffer.from(jwtMatch[1], "base64url").toString("utf-8");
      const payloadJson = Buffer.from(jwtMatch[2], "base64url").toString("utf-8");
      const header = JSON.parse(headerJson);
      const claims = JSON.parse(payloadJson);

      findings.push(`Detected JSON Web Token (algorithm: ${header.alg || "none"})`);
      if (claims.exp) {
        findings.push(`Token expires: ${new Date(claims.exp * 1000).toISOString()}`);
      }
      if (claims.sub) findings.push(`Subject (sub): ${claims.sub}`);
      if (claims.role || claims.roles) findings.push(`Roles: ${JSON.stringify(claims.role || claims.roles)}`);

      return {
        type: "JSON Web Token (JWT)",
        decoded: { header, claims, signature: jwtMatch[3] },
        jwtInfo: { header, claims },
        findings,
      };
    } catch {
      // Fall through
    }
  }

  // Check if JSON
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      findings.push("Valid structured JSON payload.");
      const keys = typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed) : [];
      if (keys.length > 0) {
        findings.push(`Root object keys (${keys.length}): ${keys.slice(0, 15).join(", ")}`);
      }
      return {
        type: "JSON Payload",
        decoded: parsed,
        findings,
      };
    } catch {
      // Fall through
    }
  }

  // Check if URL-encoded form data
  if (trimmed.includes("=") && (trimmed.includes("&") || !trimmed.includes(" "))) {
    try {
      const params = new URLSearchParams(trimmed);
      const extracted: Record<string, string> = {};
      params.forEach((val, key) => {
        extracted[key] = val;
      });
      if (Object.keys(extracted).length > 1) {
        findings.push(`Form URL-encoded parameters (${Object.keys(extracted).length} keys).`);
        return {
          type: "Form URL-Encoded",
          decoded: extracted,
          extractedParameters: extracted,
          findings,
        };
      }
    } catch {
      // Fall through
    }
  }

  // Check if Base64 string
  if (/^[A-Za-z0-9+/=]{20,}$/.test(trimmed)) {
    try {
      const buf = Buffer.from(trimmed, "base64");
      const decodedUtf8 = buf.toString("utf-8");
      findings.push(`Base64 encoded string unmasked (${buf.length} bytes decoded).`);
      return {
        type: "Base64 Encoded Data",
        decoded: decodedUtf8,
        findings,
      };
    } catch {
      // Fall through
    }
  }

  return {
    type: "Raw Unstructured Text",
    decoded: trimmed,
    findings: ["No standard serialized or encoded format detected."],
  };
}

/**
 * REA System Prompt containing the 5-phase reverse engineering methodology
 */
export const REA_SYSTEM_PROMPT = `You are running in REA (Reverse Engineer Anything) Mode, powered by Free Gravity.
Your goal is to inspect, dissect, and cleanly reconstruct software, binaries, APIs, and protocols using a rigorous 5-Phase Clean-Room Methodology:

### Phase 1: Surface & Binary Reconnaissance
- Inspect file headers, magic bytes, architectures, and compile targets using \`rea_inspect_binary\`.
- Calculate Shannon Entropy via \`rea_entropy\` to identify packed sections, encryption, or compression.
- Extract embedded strings, debug symbols, API routes, and credentials via \`rea_strings\`.

### Phase 2: Boundary & Protocol Mapping
- Decode intercepted payloads, network requests, JWTs, and serialized packets with \`rea_analyze_payload\`.
- Identify request/response structures, authorization schemes, hashing algorithms, and schema invariants.

### Phase 3: Control Flow & State Machine Extraction
- Model the core state transitions, inputs, error conditions, and internal state buffers.
- Document exact byte alignments, bitmasks, endianness, and validation rules.

### Phase 4: Clean-Room Behavioral Specification
- Write a formal, clean-room specification defining WHAT the component does without copying proprietary code.
- Explicitly detail input types, validation assertions, edge cases, and expected outputs.

### Phase 5: Self-Contained Clean Reconstruction & Test Suite
- Write clean, modern, zero-dependency TypeScript/Node.js or Python code implementing the specification.
- Create automated verification tests demonstrating 100% functional parity with the original target.

Always maintain strict objectivity, detail exact hexadecimal offsets when referencing binary structures, and output complete, production-ready code.`;

/**
 * Registers REA tools into the MCP host
 */
export function registerReaSkills(mcpHost: McpHost): void {
  // Tool 1: rea_inspect_binary
  mcpHost.registerTool({
    name: "rea_inspect_binary",
    description: "Performs deep binary reconnaissance: detects magic byte headers, inspects file metadata, and formats canonical 16-byte hex dumps.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path of the binary or asset file to inspect.",
        },
        offset: {
          type: "number",
          description: "Byte offset to begin inspection (default 0).",
        },
        length: {
          type: "number",
          description: "Number of bytes to dump in hex view (default 256, max 2048).",
        },
      },
      required: ["file_path"],
    },
    handler: async (args) => {
      const filePath = mcpHost.resolvePath(String(args.file_path));
      const offset = Math.max(0, Number(args.offset) || 0);
      const length = Math.min(2048, Math.max(16, Number(args.length) || 256));

      try {
        if (!fs.existsSync(filePath)) {
          return { status: "error", output: `File '${filePath}' not found.` };
        }

        const stat = await fsp.stat(filePath);
        const fd = await fsp.open(filePath, "r");
        const readLen = Math.min(stat.size - offset, length);
        const buffer = Buffer.alloc(Math.max(0, readLen));
        if (readLen > 0) {
          await fd.read(buffer, 0, readLen, offset);
        }
        await fd.close();

        // Detect signature from the beginning of file
        const headerBuf = Buffer.alloc(Math.min(stat.size, 64));
        const fdHeader = await fsp.open(filePath, "r");
        await fdHeader.read(headerBuf, 0, headerBuf.length, 0);
        await fdHeader.close();

        const fileType = detectFileType(headerBuf);
        const hexDump = formatHexDump(buffer, offset, length);

        const summary = [
          `=== REA Binary Inspection: ${path.basename(filePath)} ===`,
          `Path: ${filePath}`,
          `Total Size: ${stat.size} bytes (${(stat.size / 1024).toFixed(2)} KB)`,
          `Detected Type: ${fileType.name} [${fileType.category}]`,
          `Description: ${fileType.description}`,
          `Inspection Window: Offset 0x${offset.toString(16)} to 0x${(offset + readLen).toString(16)} (${readLen} bytes)`,
          "",
          hexDump,
        ].join("\n");

        return {
          status: "success",
          output: summary,
          data: {
            filePath,
            totalSize: stat.size,
            fileType,
            offset,
            length: readLen,
          },
        };
      } catch (err: any) {
        return { status: "error", output: `Failed to inspect binary '${filePath}': ${err.message}` };
      }
    },
  });

  // Tool 2: rea_strings
  mcpHost.registerTool({
    name: "rea_strings",
    description: "Extracts printable ASCII and UTF-16LE wide strings from files and auto-categorizes them into URLs, IPs, file paths, and identifiers.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path of the file to extract strings from.",
        },
        min_length: {
          type: "number",
          description: "Minimum string length threshold (default 4).",
        },
        max_results: {
          type: "number",
          description: "Maximum number of general strings to return (default 100).",
        },
      },
      required: ["file_path"],
    },
    handler: async (args) => {
      const filePath = mcpHost.resolvePath(String(args.file_path));
      const minLength = Math.max(3, Number(args.min_length) || 4);
      const maxResults = Math.min(500, Number(args.max_results) || 100);

      try {
        if (!fs.existsSync(filePath)) {
          return { status: "error", output: `File '${filePath}' not found.` };
        }

        const stat = await fsp.stat(filePath);
        // Limit string scan to first 10MB for safety
        const scanSize = Math.min(stat.size, 10 * 1024 * 1024);
        const buf = Buffer.alloc(scanSize);
        const fd = await fsp.open(filePath, "r");
        await fd.read(buf, 0, scanSize, 0);
        await fd.close();

        const result = extractStrings(buf, minLength, maxResults);
        const { categories } = result;

        const outputParts = [
          `=== REA Strings Extraction: ${path.basename(filePath)} ===`,
          `Total Unique Strings Extracted: ${result.totalFound} (scanned ${scanSize} bytes)`,
          "",
          `[URLs & Endpoints (${categories.urls.length})]:`,
          categories.urls.length ? categories.urls.map(u => `  - ${u}`).join("\n") : "  (none)",
          "",
          `[IP Addresses (${categories.ips.length})]:`,
          categories.ips.length ? categories.ips.map(ip => `  - ${ip}`).join("\n") : "  (none)",
          "",
          `[File Paths (${categories.paths.length})]:`,
          categories.paths.length ? categories.paths.map(p => `  - ${p}`).join("\n") : "  (none)",
          "",
          `[Tokens, Hashes & Keys (${categories.tokensAndKeys.length})]:`,
          categories.tokensAndKeys.length ? categories.tokensAndKeys.map(k => `  - ${k}`).join("\n") : "  (none)",
          "",
          `[Key Identifiers (${categories.identifiers.length})]:`,
          categories.identifiers.length ? categories.identifiers.slice(0, 25).map(id => `  ${id}`).join("\n") : "  (none)",
          "",
          `[General Strings Sample (${categories.general.length})]:`,
          categories.general.slice(0, 30).map(s => `  ${s}`).join("\n"),
        ];

        return {
          status: "success",
          output: outputParts.join("\n"),
          data: result,
        };
      } catch (err: any) {
        return { status: "error", output: `Strings extraction failed for '${filePath}': ${err.message}` };
      }
    },
  });

  // Tool 3: rea_entropy
  mcpHost.registerTool({
    name: "rea_entropy",
    description: "Calculates Shannon Entropy across binary chunks to pinpoint compressed, encrypted, or packed code sections.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path of the file to compute entropy on.",
        },
        chunk_size: {
          type: "number",
          description: "Chunk size for entropy breakdown in bytes (default 1024).",
        },
      },
      required: ["file_path"],
    },
    handler: async (args) => {
      const filePath = mcpHost.resolvePath(String(args.file_path));
      const chunkSize = Math.max(256, Math.min(65536, Number(args.chunk_size) || 1024));

      try {
        if (!fs.existsSync(filePath)) {
          return { status: "error", output: `File '${filePath}' not found.` };
        }

        const stat = await fsp.stat(filePath);
        const scanSize = Math.min(stat.size, 5 * 1024 * 1024);
        const buf = Buffer.alloc(scanSize);
        const fd = await fsp.open(filePath, "r");
        await fd.read(buf, 0, scanSize, 0);
        await fd.close();

        const overall = calculateShannonEntropy(buf);
        const chunkResults: Array<{ chunk: number; offset: string; entropy: number; rating: string }> = [];

        for (let i = 0; i < scanSize; i += chunkSize) {
          const slice = buf.subarray(i, Math.min(scanSize, i + chunkSize));
          const chunkEntropy = calculateShannonEntropy(slice);
          chunkResults.push({
            chunk: Math.floor(i / chunkSize),
            offset: `0x${i.toString(16).padStart(6, "0")}`,
            entropy: chunkEntropy.entropy,
            rating: chunkEntropy.rating,
          });
        }

        const sampleRows = chunkResults
          .slice(0, 20)
          .map(c => `  Chunk #${c.chunk.toString().padEnd(3)} (${c.offset}): ${c.entropy.toFixed(3)} [${c.rating}]`)
          .join("\n");

        const summary = [
          `=== REA Shannon Entropy Analysis: ${path.basename(filePath)} ===`,
          `Overall File Entropy: ${overall.entropy} / 8.000`,
          `Verdict: [${overall.rating.toUpperCase()}] - ${overall.description}`,
          `Analyzed: ${scanSize} bytes across ${chunkResults.length} chunks (${chunkSize} bytes/chunk)`,
          "",
          `Chunk Distribution (First 20 chunks):`,
          sampleRows,
          chunkResults.length > 20 ? `  ... (${chunkResults.length - 20} more chunks)` : "",
        ].join("\n");

        return {
          status: "success",
          output: summary,
          data: {
            overall,
            totalChunks: chunkResults.length,
            chunks: chunkResults,
          },
        };
      } catch (err: any) {
        return { status: "error", output: `Entropy analysis failed for '${filePath}': ${err.message}` };
      }
    },
  });

  // Tool 4: rea_analyze_payload
  mcpHost.registerTool({
    name: "rea_analyze_payload",
    description: "Analyzes network request/response payloads, decodes JWTs, Base64 strings, URL-encoded bodies, and structured JSON invariants.",
    parameters: {
      type: "object",
      properties: {
        payload: {
          type: "string",
          description: "The raw payload string, token, or network message body to analyze.",
        },
      },
      required: ["payload"],
    },
    handler: async (args) => {
      const payload = String(args.payload || "");
      if (!payload.trim()) {
        return { status: "error", output: "Payload cannot be empty." };
      }

      const result = analyzePayload(payload);
      const outputParts = [
        `=== REA Payload Analysis ===`,
        `Identified Type: ${result.type}`,
        `Findings:`,
        result.findings.map(f => `  * ${f}`).join("\n"),
        "",
        `Decoded Structure:`,
        JSON.stringify(result.decoded, null, 2),
      ];

      return {
        status: "success",
        output: outputParts.join("\n"),
        data: result,
      };
    },
  });

  // Tool 5: rea_decompile_heuristic
  mcpHost.registerTool({
    name: "rea_decompile_heuristic",
    description: "Inspects minified or obfuscated JavaScript/TypeScript bundles, identifying module bundlers, exported functions, and reconstructing an AST outline.",
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path of the JavaScript or TypeScript file to deconstruct.",
        },
      },
      required: ["file_path"],
    },
    handler: async (args) => {
      const filePath = mcpHost.resolvePath(String(args.file_path));

      try {
        if (!fs.existsSync(filePath)) {
          return { status: "error", output: `File '${filePath}' not found.` };
        }

        const code = await fsp.readFile(filePath, "utf-8");
        const lines = code.split("\n");

        const isWebpack = code.includes("__webpack_require__") || code.includes("webpackChunk");
        const isVite = code.includes("__vite__") || code.includes("import.meta.hot");
        const isRollup = code.includes("__rollup");

        const bundler = isWebpack ? "Webpack" : isVite ? "Vite" : isRollup ? "Rollup" : "Standard / Custom";

        // Heuristic function extraction
        const funcMatches = code.match(/(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>)/g) || [];
        const uniqueFuncs = Array.from(new Set(funcMatches)).slice(0, 30);

        // Class extraction
        const classMatches = code.match(/class\s+([a-zA-Z0-9_$]+)/g) || [];
        const uniqueClasses = Array.from(new Set(classMatches));

        const summary = [
          `=== REA Decompile & AST Analysis: ${path.basename(filePath)} ===`,
          `Lines of Code: ${lines.length} lines (${Buffer.byteLength(code, "utf-8")} bytes)`,
          `Detected Bundler / Runtime: ${bundler}`,
          `Classes Discovered (${uniqueClasses.length}): ${uniqueClasses.join(", ") || "(none)"}`,
          `Functions & Methods Discovered (${funcMatches.length}):`,
          uniqueFuncs.map(f => `  - ${f}`).join("\n") || "  (none)",
        ].join("\n");

        return {
          status: "success",
          output: summary,
          data: {
            bundler,
            totalLines: lines.length,
            classes: uniqueClasses,
            sampleFunctions: uniqueFuncs,
          },
        };
      } catch (err: any) {
        return { status: "error", output: `Decompilation heuristic failed for '${filePath}': ${err.message}` };
      }
    },
  });
}
