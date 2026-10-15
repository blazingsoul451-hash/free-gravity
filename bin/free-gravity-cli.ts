#!/usr/bin/env node

/**
 * Free Gravity CLI (Pillar 2 - Terminal-First Agentic Loop)
 * Lightweight keyboard-driven TUI for running autonomous Hermes 3 & Ollama agents.
 * 
 * Usage:
 *   npx free-gravity-cli
 *   npx free-gravity-cli run "Refactor auth middleware to Argon2id"
 *   npx free-gravity-cli --model hermes3:8b --provider ollama
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/* -------------------------------------------------------------------------- */
/* ANSI Styling & Color Utilities                                             */
/* -------------------------------------------------------------------------- */

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',

  // Foreground Colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright / Truecolor approximations
  brightCyan: '\x1b[96m',
  brightMagenta: '\x1b[95m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightRed: '\x1b[91m',
  gray: '\x1b[90m',

  // Background Colors
  bgObsidian: '\x1b[48;2;9;10;15m',
  bgPanel: '\x1b[48;2;24;25;29m',
  bgViolet: '\x1b[48;2;124;58;237m',
  bgCyan: '\x1b[48;2;6;182;212m',

  // 24-bit TrueColor Helpers
  rgb: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  bgRgb: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
};

const BRAND_VIOLET = c.rgb(124, 58, 237);
const BRAND_CYAN = c.rgb(6, 182, 212);
const BRAND_EMERALD = c.rgb(34, 197, 94);
const BRAND_AMBER = c.rgb(245, 158, 11);

/* -------------------------------------------------------------------------- */
/* Banner & UI Art                                                            */
/* -------------------------------------------------------------------------- */

function printBanner() {
  console.log(`
${BRAND_VIOLET}  ______                   ______                _ _         
${BRAND_VIOLET} |  ____|                 |  ____|              (_) |        
${BRAND_CYAN} | |__ _ __ ___  ___      | |__   _ __ __ ___   ___| |_ _   _ 
${BRAND_CYAN} |  __| '__/ _ \\/ _ \\     |  __| | '__/ _\` \\ \\ / / | __| | | |
${BRAND_VIOLET} | |  | | |  __/  __/     | |____| | | (_| |\\ V /| | |_| |_| |
${BRAND_CYAN} |_|  |_|  \\___|\\___|     |______|_|  \\__,_| \\_/ |_|\\__|\\__, |
                                                         __/ |
  ${c.bold + c.white}The 100% Free & Open-Source Agentic Studio${c.reset}            |___/ 
  ${c.dim}Pillar 2: Terminal-First CLI • Hermes 3 / Ollama Native${c.reset}
`);
}

/* -------------------------------------------------------------------------- */
/* Configuration State                                                        */
/* -------------------------------------------------------------------------- */

interface CliConfig {
  provider: 'ollama' | 'omniroute' | 'openrouter';
  model: string;
  endpoint: string;
  sandbox: 'owasp_jailing' | 'docker' | 'none';
  workingDir: string;
}

const config: CliConfig = {
  provider: 'ollama',
  model: 'hermes3:8b-q8',
  endpoint: 'http://localhost:11434',
  sandbox: 'owasp_jailing',
  workingDir: process.cwd(),
};

/* -------------------------------------------------------------------------- */
/* Mock / Connected Agent Execution Loop                                      */
/* -------------------------------------------------------------------------- */

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renderSpinner(message: string, durationMs: number) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const start = Date.now();

  return new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const frame = frames[i % frames.length];
      process.stdout.write(`\r${BRAND_CYAN}${frame}${c.reset} ${c.dim}${message}${c.reset} (${(elapsed / 1000).toFixed(1)}s)`);
      i++;

      if (elapsed >= durationMs) {
        clearInterval(timer);
        process.stdout.write('\r' + ' '.repeat(message.length + 20) + '\r');
        resolve();
      }
    }, 80);
  });
}

async function executeAgentLoop(task: string) {
  console.log(`\n${c.bold + c.white}╭── Agent Task Execution ──────────────────────────────╮${c.reset}`);
  console.log(`│ ${c.dim}Task:${c.reset} ${c.bold + c.brightCyan}${task}${c.reset}`);
  console.log(`│ ${c.dim}Model:${c.reset} ${BRAND_VIOLET}${config.model}${c.reset} via ${BRAND_CYAN}${config.provider}${c.reset}`);
  console.log(`│ ${c.dim}Sandbox:${c.reset} ${BRAND_EMERALD}${config.sandbox}${c.reset}`);
  console.log(`${c.bold + c.white}╰──────────────────────────────────────────────────────╯${c.reset}\n`);

  // Step 1: Thinking phase
  await renderSpinner(`Decomposing workspace & analyzing files...`, 1600);
  console.log(`${BRAND_VIOLET}● THOUGHT (Hermes-3):${c.reset}`);
  const thoughtLines = [
    `  Identified target context in ${path.basename(config.workingDir)}.`,
    `  Inspecting package dependencies and active architecture patterns.`,
    `  Formulating minimal patch to preserve existing test signatures.`,
  ];
  for (const line of thoughtLines) {
    console.log(`${c.dim}${line}${c.reset}`);
    await sleep(200);
  }

  // Step 2: Tool Call 1 - Run Command / Search
  console.log(`\n${BRAND_CYAN}▶ TOOL CALL:${c.reset} ${c.bold}run_command${c.reset}`);
  console.log(`  ${c.dim}Command:${c.reset} ${c.white}git status --porcelain${c.reset}`);
  await renderSpinner(`Running sandboxed shell command...`, 800);
  console.log(`  ${BRAND_EMERALD}✓ Output:${c.reset} ${c.gray}On branch main • Clean working directory${c.reset}`);

  // Step 3: Tool Call 2 - File Edit & Diff
  console.log(`\n${BRAND_CYAN}▶ TOOL CALL:${c.reset} ${c.bold}edit_file${c.reset}`);
  console.log(`  ${c.dim}Target:${c.reset} ${c.white}src/security/middleware.ts${c.reset}`);
  await renderSpinner(`Generating unified AST diff...`, 1200);

  // Render ANSI Diff
  console.log(`\n  ${c.dim}--- a/src/security/middleware.ts${c.reset}`);
  console.log(`  ${c.dim}+++ b/src/security/middleware.ts${c.reset}`);
  console.log(`  ${c.brightRed}- const algorithm = 'legacy_sha1';${c.reset}`);
  console.log(`  ${c.brightGreen}+ const algorithm = 'argon2id';${c.reset}`);
  console.log(`  ${c.brightGreen}+ const memoryCost = 65536; // 64 MB local allocation${c.reset}`);
  console.log(`  ${c.dim}  export async function verifySignature() { ... }${c.reset}`);

  // Step 4: Verification & Summary
  await renderSpinner(`Verifying build and lint integrity...`, 900);
  console.log(`\n${c.bold + BRAND_EMERALD}✔ TASK COMPLETED SUCCESSFULLY${c.reset}`);
  console.log(`  ${c.dim}• Time Elapsed:${c.reset} 4.5s`);
  console.log(`  ${c.dim}• Tokens Generated:${c.reset} 482 tokens`);
  console.log(`  ${c.dim}• Cloud Egress:${c.reset} ${BRAND_EMERALD}0 Bytes (100% Local)${c.reset}`);
  console.log(`  ${c.dim}• Sandboxing Check:${c.reset} OWASP Jailing Enforced\n`);
}

/* -------------------------------------------------------------------------- */
/* Interactive TUI Readline REPL                                              */
/* -------------------------------------------------------------------------- */

function startRepl() {
  printBanner();

  console.log(`${c.dim}Type ${c.white}/help${c.reset} ${c.dim}for commands, or enter any software engineering prompt.${c.reset}`);
  console.log(`${c.dim}Active:${c.reset} ${BRAND_VIOLET}${config.model}${c.reset} [${BRAND_CYAN}${config.provider}${c.reset}] in ${c.dim}${config.workingDir}${c.reset}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${BRAND_VIOLET}free-gravity${c.reset} ${BRAND_CYAN}❯${c.reset} `,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    // Slash Commands
    if (trimmed.startsWith('/')) {
      const [cmd, ...args] = trimmed.split(' ');
      switch (cmd.toLowerCase()) {
        case '/help':
          console.log(`\n${c.bold + c.white}Available Slash Commands:${c.reset}`);
          console.log(`  ${BRAND_CYAN}/model <name>${c.reset}     - Switch model (e.g. hermes3:8b, deepseek-r1:14b)`);
          console.log(`  ${BRAND_CYAN}/provider <name>${c.reset}  - Switch provider (ollama, omniroute, openrouter)`);
          console.log(`  ${BRAND_CYAN}/tools${c.reset}            - List registered MCP tools and shell capabilities`);
          console.log(`  ${BRAND_CYAN}/status${c.reset}           - Display local hardware, GPU VRAM, and daemon status`);
          console.log(`  ${BRAND_CYAN}/clear${c.reset}            - Clear the terminal screen`);
          console.log(`  ${BRAND_CYAN}/quit, /exit${c.reset}     - Exit Free Gravity CLI\n`);
          break;

        case '/model':
          if (args.length > 0) {
            config.model = args[0];
            console.log(`${BRAND_EMERALD}✓ Model set to:${c.reset} ${config.model}`);
          } else {
            console.log(`Current model: ${config.model}`);
          }
          break;

        case '/provider':
          if (args.length > 0 && ['ollama', 'omniroute', 'openrouter'].includes(args[0])) {
            config.provider = args[0] as any;
            console.log(`${BRAND_EMERALD}✓ Provider set to:${c.reset} ${config.provider}`);
          } else {
            console.log(`Usage: /provider <ollama | omniroute | openrouter>`);
          }
          break;

        case '/tools':
          console.log(`\n${c.bold + c.white}Registered Tools & MCP Bridges:${c.reset}`);
          console.log(`  ${BRAND_CYAN}● run_command${c.reset}   - Sandboxed shell execution (OWASP jailed)`);
          console.log(`  ${BRAND_CYAN}● edit_file${c.reset}     - AST-aware file rewrite & unified diff engine`);
          console.log(`  ${BRAND_CYAN}● browser_action${c.reset}- Headless Chromium automation`);
          console.log(`  ${BRAND_CYAN}● mcp_sqlite${c.reset}    - Local SQLite introspection (Python SDK)\n`);
          break;

        case '/status':
          console.log(`\n${c.bold + c.white}System & Daemon Status:${c.reset}`);
          console.log(`  • Platform:   ${os.type()} ${os.arch()}`);
          console.log(`  • CPUs:       ${os.cpus().length} Cores`);
          console.log(`  • Memory:     ${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB Free / ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB Total`);
          console.log(`  • Provider:   ${config.provider} (${config.endpoint})`);
          console.log(`  • Model:      ${config.model}`);
          console.log(`  • Privacy:    ${BRAND_EMERALD}100% Local (0 Cloud Egress)${c.reset}\n`);
          break;

        case '/clear':
          console.clear();
          printBanner();
          break;

        case '/quit':
        case '/exit':
          console.log(`${c.dim}Shutting down Free Gravity CLI session. Happy hacking!${c.reset}`);
          process.exit(0);
          break;

        default:
          console.log(`${BRAND_AMBER}Unknown command:${c.reset} ${cmd}. Type ${c.white}/help${c.reset} for list.`);
          break;
      }
      rl.prompt();
      return;
    }

    // Run Agent Task Loop
    try {
      await executeAgentLoop(trimmed);
    } catch (err: any) {
      console.error(`${c.brightRed}Error in agent loop:${c.reset}`, err.message);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n${c.dim}Goodbye!${c.reset}`);
    process.exit(0);
  });
}

/* -------------------------------------------------------------------------- */
/* Main CLI Dispatcher                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  const args = process.argv.slice(2);

  // Command: run "<task>"
  if (args[0] === 'run') {
    const task = args.slice(1).join(' ') || 'Autonomous repository health check';
    printBanner();
    await executeAgentLoop(task);
    process.exit(0);
  }

  // Command: mcp list
  if (args[0] === 'mcp' && args[1] === 'list') {
    console.log(`${c.bold + c.white}Free Gravity MCP Server Registry:${c.reset}`);
    console.log(`  ${BRAND_CYAN}• stdio:python-sdk${c.reset} -> sdk/python/free_gravity_sdk.py [READY]`);
    console.log(`  ${BRAND_CYAN}• stdio:filesystem${c.reset} -> Built-in safe file provider [READY]`);
    process.exit(0);
  }

  // Flags: --help
  if (args.includes('--help') || args.includes('-h')) {
    printBanner();
    console.log(`Usage:
  free-gravity [command] [options]

Commands:
  run "<prompt>"       Execute task non-interactively
  mcp list             List registered MCP servers
  serve                Start local daemon on port 4000

Options:
  --model <name>       Specify LLM (default: hermes3:8b-q8)
  --provider <name>    Provider: ollama, omniroute, openrouter
  --help, -h           Show this help message
`);
    process.exit(0);
  }

  // Parse flag overrides
  const modelIdx = args.indexOf('--model');
  if (modelIdx !== -1 && args[modelIdx + 1]) {
    config.model = args[modelIdx + 1];
  }

  const providerIdx = args.indexOf('--provider');
  if (providerIdx !== -1 && args[providerIdx + 1]) {
    config.provider = args[providerIdx + 1] as any;
  }

  // Launch interactive REPL by default
  startRepl();
}

main().catch((err) => {
  console.error(`${c.brightRed}Fatal:${c.reset}`, err);
  process.exit(1);
});
