/**
 * Free Gravity - OWASP Top 10 for Agentic Applications (ASI) Guard
 * 
 * ASI05: Workspace Root Jailing & Path Traversal Guard
 * ASI02: Destructive & Privilege Escalation Command Interceptor (HITL Guard)
 * ASI01: Indirect Prompt Injection Isolation & Steganographic Defense
 * Real-Time Secret Redaction Engine
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface WorkspaceValidationResult {
  allowed: boolean;
  resolvedPath: string;
  workspaceRoot: string;
  error?: string;
  violationType?: 'TRAVERSAL' | 'SENSITIVE_DIRECTORY' | 'OUTSIDE_ROOT' | 'INVALID_PATH';
}

export interface CommandInspectionResult {
  cmd: string;
  isDangerous: boolean;
  riskLevel: RiskLevel;
  reasons: string[];
  requiresHITL: boolean;
  suggestedAction: 'ALLOW' | 'PROMPT_USER' | 'BLOCK';
}

export interface HITLRequest {
  id: string;
  timestamp: number;
  command: string;
  riskLevel: RiskLevel;
  reasons: string[];
  metadata?: Record<string, unknown>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TIMED_OUT';
  approver?: string;
  resolvedAt?: number;
}

// ============================================================================
// ASI05: Workspace Root Jailing (Path Traversal & Escape Prevention)
// ============================================================================

const SENSITIVE_DIRECTORIES_WINDOWS = [
  'system32',
  'syswow64',
  'windows',
  'program files',
  'program files (x86)',
  'programdata',
  'appdata\\roaming\\microsoft\\windows\\start menu',
];

const SENSITIVE_DIRECTORIES_UNIX = [
  '/etc',
  '/var',
  '/proc',
  '/sys',
  '/dev',
  '/boot',
  '/root',
  '/usr/bin',
  '/usr/sbin',
  '/bin',
  '/sbin',
];

const SENSITIVE_FILE_NAMES = [
  '.ssh',
  '.aws',
  '.gnupg',
  '.git-credentials',
  '.netrc',
  '.bash_history',
  '.zsh_history',
  '.npmrc',
  '.pypirc',
  'id_rsa',
  'id_ed25519',
  'id_ecdsa',
  'known_hosts',
  'authorized_keys',
  'sam',
  'system',
  'security',
];

/**
 * Resolves the real canonical path even if the final file/directory does not yet exist.
 * Walks up directory ancestors until an existing directory is found, calls fs.realpathSync,
 * and appends the non-existent tail.
 */
function getCanonicalPath(targetPath: string): string {
  const resolved = path.resolve(targetPath);
  if (fs.existsSync(resolved)) {
    try {
      return fs.realpathSync.native ? fs.realpathSync.native(resolved) : fs.realpathSync(resolved);
    } catch {
      return resolved;
    }
  }

  // Walk up to find existing parent
  let current = resolved;
  const tailSegments: string[] = [];

  while (current && current !== path.dirname(current)) {
    tailSegments.unshift(path.basename(current));
    current = path.dirname(current);
    if (fs.existsSync(current)) {
      try {
        const canonicalParent = fs.realpathSync.native ? fs.realpathSync.native(current) : fs.realpathSync(current);
        return path.join(canonicalParent, ...tailSegments);
      } catch {
        return resolved;
      }
    }
  }

  return resolved;
}

/**
 * Validates that a target path strictly resides within the active workspace root.
 * Protects against ../.. traversal, symlink escapes, null bytes, and sensitive system directories.
 */
export function validateWorkspacePath(
  targetPath: string,
  workspaceRoot?: string
): WorkspaceValidationResult {
  const root = workspaceRoot ? path.resolve(workspaceRoot) : process.cwd();

  // 1. Check for null byte injection
  if (!targetPath || targetPath.includes('\0')) {
    return {
      allowed: false,
      resolvedPath: '',
      workspaceRoot: root,
      error: 'Null byte injection detected in target path.',
      violationType: 'INVALID_PATH',
    };
  }

  // 2. Decode URI components in case traversal was encoded (%2e%2e)
  let decodedPath = targetPath;
  try {
    decodedPath = decodeURIComponent(targetPath);
  } catch {
    // If decoding fails, keep raw
  }

  // 3. Resolve canonical paths (dereferencing symlinks)
  const canonicalRoot = getCanonicalPath(root);
  const canonicalTarget = getCanonicalPath(path.resolve(canonicalRoot, decodedPath));

  // 4. Normalize case for case-insensitive filesystems (Windows/macOS)
  const isWindows = process.platform === 'win32';
  const rootForComparison = isWindows ? canonicalRoot.toLowerCase() : canonicalRoot;
  const targetForComparison = isWindows ? canonicalTarget.toLowerCase() : canonicalTarget;

  // 5. Check sensitive directory patterns
  const lowerTarget = canonicalTarget.toLowerCase();
  for (const sensitiveName of SENSITIVE_FILE_NAMES) {
    const segments = lowerTarget.split(/[\\/]/);
    if (segments.includes(sensitiveName)) {
      return {
        allowed: false,
        resolvedPath: canonicalTarget,
        workspaceRoot: canonicalRoot,
        error: `Access to sensitive credential or configuration target is strictly blocked: ${sensitiveName}`,
        violationType: 'SENSITIVE_DIRECTORY',
      };
    }
  }

  if (isWindows) {
    for (const sysDir of SENSITIVE_DIRECTORIES_WINDOWS) {
      if (lowerTarget.includes(sysDir)) {
        return {
          allowed: false,
          resolvedPath: canonicalTarget,
          workspaceRoot: canonicalRoot,
          error: `Access to Windows system directory is blocked: ${sysDir}`,
          violationType: 'SENSITIVE_DIRECTORY',
        };
      }
    }
  } else {
    for (const sysDir of SENSITIVE_DIRECTORIES_UNIX) {
      if (lowerTarget === sysDir || lowerTarget.startsWith(sysDir + '/')) {
        return {
          allowed: false,
          resolvedPath: canonicalTarget,
          workspaceRoot: canonicalRoot,
          error: `Access to system directory is blocked: ${sysDir}`,
          violationType: 'SENSITIVE_DIRECTORY',
        };
      }
    }
  }

  // 6. Root boundary containment check
  // Must match either exact root or root followed by path separator
  const rootPrefix = rootForComparison.endsWith(path.sep)
    ? rootForComparison
    : rootForComparison + path.sep;

  const isExactRoot = targetForComparison === rootForComparison;
  const isInsideRoot = targetForComparison.startsWith(rootPrefix);

  if (!isExactRoot && !isInsideRoot) {
    return {
      allowed: false,
      resolvedPath: canonicalTarget,
      workspaceRoot: canonicalRoot,
      error: `Path traversal violation: Target "${targetPath}" resolves to "${canonicalTarget}", which escapes workspace root "${canonicalRoot}".`,
      violationType: 'OUTSIDE_ROOT',
    };
  }

  return {
    allowed: true,
    resolvedPath: canonicalTarget,
    workspaceRoot: canonicalRoot,
  };
}

/**
 * Asserts workspace path safety or throws an Error.
 */
export function assertWorkspacePath(targetPath: string, workspaceRoot?: string): string {
  const result = validateWorkspacePath(targetPath, workspaceRoot);
  if (!result.allowed) {
    throw new Error(`[OWASP ASI05 Security Violation] ${result.error}`);
  }
  return result.resolvedPath;
}

// ============================================================================
// ASI02: Destructive Command Interceptor & HITL Guard
// ============================================================================

interface DestructivePattern {
  regex: RegExp;
  reason: string;
  riskLevel: RiskLevel;
}

const DESTRUCTIVE_RULES: DestructivePattern[] = [
  // Destruction of files & directories
  {
    regex: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|--recursive\s+--force|-f\s+-r|-r\s+-f)\b/i,
    reason: 'Recursive forced file removal (rm -rf)',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\b(del|erase)\s+.*(\/f|\/s|\/q)\b/i,
    reason: 'Silent recursive file deletion on Windows (del /s /q)',
    riskLevel: 'HIGH',
  },
  {
    regex: /\brmdir\s+.*(\/s|\/q)\b/i,
    reason: 'Recursive directory removal on Windows (rmdir /s)',
    riskLevel: 'HIGH',
  },
  {
    regex: /\bRemove-Item\s+.*(-Recurse|-Force)\b/i,
    reason: 'PowerShell forced recursive deletion (Remove-Item -Recurse)',
    riskLevel: 'HIGH',
  },
  {
    regex: /\b(shred|wipe|srm)\b/i,
    reason: 'Secure deletion / file shredding utility',
    riskLevel: 'HIGH',
  },

  // Disk & Filesystem partitioning
  {
    regex: /\bmkfs(\.[a-z0-9]+)?\b/i,
    reason: 'Filesystem format operation (mkfs)',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\bformat\s+[a-zA-Z]:/i,
    reason: 'Windows drive format command',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\bdd\s+if=/i,
    reason: 'Raw block device write (dd)',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\b(fdisk|parted|diskpart)\b/i,
    reason: 'Partition table manipulation tool',
    riskLevel: 'CRITICAL',
  },

  // Remote code piping / Execution
  {
    regex: /\b(curl|wget|fetch|iwr|Invoke-WebRequest)\b.*\|\s*(bash|sh|zsh|python|perl|pwsh|powershell|iex|Invoke-Expression)\b/i,
    reason: 'Piping remote web content directly into shell execution',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\b(Invoke-Expression|iex)\b/i,
    reason: 'PowerShell arbitrary code evaluation (Invoke-Expression)',
    riskLevel: 'HIGH',
  },

  // Version Control Overwrites
  {
    regex: /\bgit\s+push\s+.*(--force|-f)\b/i,
    reason: 'Forced git push overwriting remote history',
    riskLevel: 'HIGH',
  },
  {
    regex: /\bgit\s+reset\s+--hard\b/i,
    reason: 'Git hard reset discarding uncommitted and local changes',
    riskLevel: 'MEDIUM',
  },
  {
    regex: /\bgit\s+clean\s+.*(-[a-zA-Z]*f[a-zA-Z]*d[a-zA-Z]*x?)\b/i,
    reason: 'Forced git clean deleting untracked files',
    riskLevel: 'MEDIUM',
  },

  // Privilege escalation & Permission tampering
  {
    regex: /\bchmod\s+(-[a-zA-Z]*R[a-zA-Z]*\s+)?(777|666)\b/i,
    reason: 'Insecure universal permissions granting full control (chmod 777)',
    riskLevel: 'HIGH',
  },
  {
    regex: /\bchown\s+.*root\b/i,
    reason: 'Transferring file ownership to root',
    riskLevel: 'HIGH',
  },
  {
    regex: /\b(takeown|icacls)\s+.*(\/grant.*Everyone:F|\/f)/i,
    reason: 'Windows ownership takeover or universal permission grant',
    riskLevel: 'HIGH',
  },

  // System shutdown / reboot / state changes
  {
    regex: /\b(shutdown|reboot|poweroff|halt)\b/i,
    reason: 'System shutdown or reboot command',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\b(Stop-Computer|Restart-Computer)\b/i,
    reason: 'PowerShell system shutdown or restart cmdlet',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\binit\s+[06]\b/i,
    reason: 'System runlevel shift to halt or reboot',
    riskLevel: 'CRITICAL',
  },

  // Denial of Service & Forkbombs
  {
    regex: /:\(\)\s*\{\s*:\|:&\s*\}\s*;\s*:/,
    reason: 'Classic Unix fork bomb (:(){ :|:& };:)',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /%\s*0\s*\|\s*%\s*0/,
    reason: 'Windows batch fork bomb',
    riskLevel: 'CRITICAL',
  },

  // Reverse shells & network sockets
  {
    regex: /\b(nc|ncat|netcat)\s+.*(-e|\/bin\/(ba)?sh)\b/i,
    reason: 'Netcat reverse shell invocation',
    riskLevel: 'CRITICAL',
  },
  {
    regex: /\/dev\/tcp\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d+/i,
    reason: 'Bash direct TCP pseudo-device exfiltration or reverse shell',
    riskLevel: 'CRITICAL',
  },

  // SQL Destructive commands
  {
    regex: /\bDROP\s+(DATABASE|TABLE|SCHEMA)\b/i,
    reason: 'SQL destructive DROP statement',
    riskLevel: 'HIGH',
  },
  {
    regex: /\bTRUNCATE\s+TABLE\b/i,
    reason: 'SQL table truncation statement',
    riskLevel: 'HIGH',
  },
];

/**
 * Inspects a shell command string against OWASP ASI02 destructive command rules.
 */
export function inspectCommand(cmd: string): CommandInspectionResult {
  const normalized = (cmd || '').trim();
  const reasons: string[] = [];
  let highestRisk: RiskLevel = 'SAFE';

  const riskOrder: Record<RiskLevel, number> = {
    SAFE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  for (const rule of DESTRUCTIVE_RULES) {
    if (rule.regex.test(normalized)) {
      reasons.push(rule.reason);
      if (riskOrder[rule.riskLevel] > riskOrder[highestRisk]) {
        highestRisk = rule.riskLevel;
      }
    }
  }

  const isDangerous = highestRisk === 'HIGH' || highestRisk === 'CRITICAL';
  const requiresHITL = isDangerous || highestRisk === 'MEDIUM';

  return {
    cmd: normalized,
    isDangerous,
    riskLevel: highestRisk,
    reasons,
    requiresHITL,
    suggestedAction: isDangerous ? 'BLOCK' : requiresHITL ? 'PROMPT_USER' : 'ALLOW',
  };
}

/**
 * Human-in-the-Loop (HITL) Approval Registry & Manager
 */
export class HITLApprovalManager extends EventEmitter {
  private pendingRequests = new Map<string, HITLRequest>();
  private defaultTimeoutMs: number;

  constructor(defaultTimeoutMs = 300000) {
    super();
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  /**
   * Submits a dangerous command for human approval and returns a Promise that pauses execution
   * until approved or rejected via WebSocket or REST.
   */
  public async requestApproval(
    command: string,
    inspection: CommandInspectionResult,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const id = `hitl-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const request: HITLRequest = {
      id,
      timestamp: Date.now(),
      command,
      riskLevel: inspection.riskLevel,
      reasons: inspection.reasons,
      metadata,
      status: 'PENDING',
    };

    this.pendingRequests.set(id, request);
    this.emit('hitl_required', request);

    return new Promise<boolean>((resolve) => {
      let timer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        this.removeListener(`hitl_resolved_${id}`, onResolved);
      };

      const onResolved = (approved: boolean) => {
        cleanup();
        resolve(approved);
      };

      this.once(`hitl_resolved_${id}`, onResolved);

      timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          const req = this.pendingRequests.get(id)!;
          req.status = 'TIMED_OUT';
          req.resolvedAt = Date.now();
          this.emit('hitl_timeout', req);
          cleanup();
          resolve(false);
        }
      }, this.defaultTimeoutMs);
    });
  }

  /**
   * Resolves a pending HITL request.
   */
  public resolveApproval(requestId: string, approved: boolean, approver = 'user'): boolean {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'PENDING') {
      return false;
    }

    request.status = approved ? 'APPROVED' : 'REJECTED';
    request.approver = approver;
    request.resolvedAt = Date.now();

    this.emit(`hitl_resolved_${requestId}`, approved);
    this.emit('hitl_resolved', request);
    return true;
  }

  public getPendingRequests(): HITLRequest[] {
    return Array.from(this.pendingRequests.values()).filter((r) => r.status === 'PENDING');
  }

  public getRequest(id: string): HITLRequest | undefined {
    return this.pendingRequests.get(id);
  }

  public clearExpiredRequests(): void {
    const now = Date.now();
    for (const [id, req] of this.pendingRequests.entries()) {
      if (req.status !== 'PENDING' && now - (req.resolvedAt || req.timestamp) > 3600000) {
        this.pendingRequests.delete(id);
      }
    }
  }
}

export const hitlGuard = new HITLApprovalManager();

// ============================================================================
// ASI01: Indirect Prompt Injection Isolation & Steganographic Defense
// ============================================================================

/**
 * Strips hidden CSS styling, dangerous tags, steganographic Unicode,
 * and wraps untrusted web content in a strict boundary container.
 */
export function sanitizeUntrustedWebContent(rawHtmlOrText: string): string {
  if (!rawHtmlOrText) {
    return '<untrusted_web_content></untrusted_web_content>';
  }

  let sanitized = rawHtmlOrText;

  // 1. Remove dangerous script, style, iframe, object, embed tags entirely
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');

  // 2. Remove HTML comments (frequent vector for stealth instruction injections)
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

  // 3. Remove CSS display:none, opacity:0, font-size:0, visibility:hidden inline styles
  sanitized = sanitized.replace(
    /style\s*=\s*["'][^"']*(?:display\s*:\s*none|opacity\s*:\s*0(?:\.0+)?|font-size\s*:\s*0(?:px|pt|em|rem)?|visibility\s*:\s*hidden|color\s*:\s*transparent|text-indent\s*:\s*-[0-9]{3,}px|clip\s*:\s*rect\([^)]+\)|transform\s*:\s*scale\(0\))[^"']*["']/gi,
    'style="display:none-sanitized;"'
  );

  // 4. Strip invisible elements with aria-hidden="true" or hidden attributes
  sanitized = sanitized.replace(/<([a-z0-9]+)\b[^>]*(?:aria-hidden\s*=\s*["']true["']|\bhidden\b)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // 5. Strip steganographic and zero-width Unicode characters used for hidden instructions:
  // - U+200B: Zero-width space
  // - U+200C: Zero-width non-joiner
  // - U+200D: Zero-width joiner
  // - U+200E / U+200F: LTR / RTL direction marks
  // - U+FEFF: Zero-width no-break space (BOM)
  // - U+00AD: Soft hyphen
  // - U+E0000 - U+E007F: Unicode Tag Characters (steganographic ASCII)
  // - U+202A - U+202E / U+2066 - U+2069: Bidi Override controls
  sanitized = sanitized
    .replace(/[\u200B-\u200F\uFEFF\u00AD]/g, '')
    .replace(/[\u{E0000}-\u{E007F}]/gu, '')
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '');

  // 6. Neutralize common prompt injection prefixes inside external web content
  const promptInjectionPrefixes = [
    /(\b(?:System|Assistant|Human|Developer)\s*:\s*(?:ignore\s+(?:all\s+)?previous\s+instructions|disregard|you\s+are\s+now))/gi,
    /(<\/?(?:im_start|im_end|sys|INST|SYS)>)/gi,
  ];

  for (const regex of promptInjectionPrefixes) {
    sanitized = sanitized.replace(regex, '[FILTERED_INJECTION_TRIGGER: $1]');
  }

  // 7. Enclose in strict containment tags
  return `<untrusted_web_content>\n${sanitized.trim()}\n</untrusted_web_content>`;
}

// ============================================================================
// Real-Time Secret Redaction Engine
// ============================================================================

interface SecretRule {
  name: string;
  regex: RegExp;
  replacement: string;
}

const SECRET_PATTERNS: SecretRule[] = [
  // OpenAI Keys (sk-...)
  {
    name: 'OpenAI API Key',
    regex: /\b(sk-[a-zA-Z0-9_-]{20,})\b/g,
    replacement: 'sk-...[REDACTED_OPENAI_KEY]',
  },
  // Anthropic Keys (sk-ant-...)
  {
    name: 'Anthropic API Key',
    regex: /\b(sk-ant-[a-zA-Z0-9_-]{20,})\b/g,
    replacement: 'sk-ant-...[REDACTED_ANTHROPIC_KEY]',
  },
  // GitHub Personal Access Tokens
  {
    name: 'GitHub Classic Token',
    regex: /\b(ghp_[a-zA-Z0-9]{36})\b/g,
    replacement: 'ghp_...[REDACTED_GITHUB_PAT]',
  },
  {
    name: 'GitHub Fine-grained PAT',
    regex: /\b(github_pat_[a-zA-Z0-9_]{50,})\b/g,
    replacement: 'github_pat_...[REDACTED_GITHUB_PAT]',
  },
  {
    name: 'GitHub OAuth Token',
    regex: /\b(gho_[a-zA-Z0-9]{36})\b/g,
    replacement: 'gho_...[REDACTED_GITHUB_OAUTH]',
  },
  {
    name: 'GitHub App / Refresh Token',
    regex: /\b(ghs_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36})\b/g,
    replacement: 'ghs_...[REDACTED_GITHUB_TOKEN]',
  },
  // Google / Gemini API Keys (AIza...)
  {
    name: 'Google API Key',
    regex: /\b(AIza[0-9A-Za-z\-_]{35})\b/g,
    replacement: 'AIza...[REDACTED_GOOGLE_KEY]',
  },
  // Slack Tokens (xoxb-, xoxp-, xoxa-, etc.)
  {
    name: 'Slack Token',
    regex: /\b(xox[baprs]-[0-9a-zA-Z\-]{10,})\b/g,
    replacement: 'xox...[REDACTED_SLACK_TOKEN]',
  },
  // HTTP Authorization Bearer Tokens
  {
    name: 'Bearer Token',
    regex: /\b(Bearer\s+)([a-zA-Z0-9\-_.~+/]+=*)\b/gi,
    replacement: '$1[REDACTED_BEARER_TOKEN]',
  },
  // AWS Access Keys
  {
    name: 'AWS Access Key ID',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    replacement: 'AKIA...[REDACTED_AWS_KEY]',
  },
  // AWS Secret Access Key in common env/config output
  {
    name: 'AWS Secret Key',
    regex: /(aws_secret_access_key\s*[:=]\s*['"]?)[a-zA-Z0-9/+=]{40}(['"]?)/gi,
    replacement: '$1[REDACTED_AWS_SECRET]$2',
  },
  // Hugging Face Tokens
  {
    name: 'HuggingFace Token',
    regex: /\b(hf_[a-zA-Z0-9]{34,})\b/g,
    replacement: 'hf_...[REDACTED_HF_TOKEN]',
  },
  // Private Key Blocks (RSA, EC, OPENSSH, etc.)
  {
    name: 'Private Key Block',
    regex: /-----BEGIN\s+(?:[A-Z\s]+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:[A-Z\s]+)?PRIVATE\s+KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY_BLOCK]',
  },
  // Generic password/secret key-value assignments
  {
    name: 'Generic Secret Field',
    regex: /((?:password|passwd|api_key|apiKey|secret_key|secretKey|auth_token|authToken)\s*[:=]\s*['"]?)([^\s'",;]{8,})(['"]?)/gi,
    replacement: '$1[REDACTED_SECRET]$3',
  },
];

/**
 * Redacts secrets, tokens, API keys, and private credentials from stdout, logs, or error streams.
 */
export function redactSecrets(input: string): string {
  if (!input) return input;
  let redacted = input;

  for (const rule of SECRET_PATTERNS) {
    redacted = redacted.replace(rule.regex, rule.replacement);
  }

  return redacted;
}
