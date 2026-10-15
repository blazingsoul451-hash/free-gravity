import { Session, CronJob, McpSkill, Settings, Message } from '../types';

export const INITIAL_SETTINGS: Settings = {
  provider: 'omniroute',
  apiKey: 'sk-or-v1-demo-free-tier',
  model: 'nousresearch/hermes-3-llama-3.1-405b:free',
  customEndpoint: 'http://localhost:11434',
  temperature: 0.3,
  systemPrompt: `You are Hermes Agent in Free Gravity, an uncapped open-source autonomous agentic IDE.
You solve coding, terminal, and browser automation tasks.
Always plan inside <thought>...</thought> blocks before executing tools.
Available tools: run_command, browser_navigate, browser_click, browser_type, browser_screenshot, read_file, write_to_file, replace_file_content, schedule.`,
  sandboxing: 'owasp_jailing',
  hitlInterceptor: true,
  browserMode: 'headless',
};

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 's-1',
    title: 'Automate Playwright E2E & Diff Test',
    timestamp: '10 mins ago',
    category: 'Today',
    messageCount: 8,
    activeModel: 'Hermes 3 405B (Free)',
  },
  {
    id: 's-2',
    title: 'Reverse Engineer Competitor Landing Page',
    timestamp: '2 hours ago',
    category: 'Today',
    messageCount: 14,
    activeModel: 'Hermes 3 405B (Free)',
  },
  {
    id: 's-3',
    title: 'Fix WebSocket Screencast Latency in CDP',
    timestamp: 'Yesterday',
    category: 'Yesterday',
    messageCount: 6,
    activeModel: 'DeepSeek R1 (Free)',
  },
  {
    id: 's-4',
    title: 'Setup morluto/rea Skill Protocol',
    timestamp: 'Oct 12',
    category: 'Older',
    messageCount: 19,
    activeModel: 'Hermes 3 70B',
  },
];

export const INITIAL_CRON_JOBS: CronJob[] = [
  {
    id: 'cron-1',
    name: 'Workspace Health & Lint Monitor',
    schedule: '*/30 * * * *',
    prompt: 'Check workspace git status and run tests on active branch',
    enabled: true,
    lastRun: '14 mins ago',
    nextRun: 'in 16 mins',
  },
  {
    id: 'cron-2',
    name: 'Morning Issue & Commits Brief',
    schedule: '0 9 * * *',
    prompt: 'Summarize git commits made in the last 24h and draft progress report',
    enabled: true,
    lastRun: 'Yesterday at 9:00 AM',
    nextRun: 'Tomorrow at 9:00 AM',
  },
  {
    id: 'cron-3',
    name: 'Weekly OWASP ASI05 Security Audit',
    schedule: '0 0 * * 0',
    prompt: 'Scan for unauthorized file path traversals and suspicious dependencies',
    enabled: false,
    nextRun: 'Sunday at 12:00 AM',
  },
];

export const INITIAL_MCP_SKILLS: McpSkill[] = [
  {
    id: 'mcp-playwright',
    name: 'playwright-cdp',
    description: 'High-speed browser automation, DOM inspection, and CDP screencast',
    category: 'browser',
    status: 'connected',
    toolsCount: 6,
    enabled: true,
  },
  {
    id: 'mcp-filesystem',
    name: 'filesystem (OWASP ASI05)',
    description: 'Workspace-jailed safe read, write, and patch operations',
    category: 'core',
    status: 'connected',
    toolsCount: 4,
    enabled: true,
  },
  {
    id: 'mcp-terminal',
    name: 'interactive-terminal (HITL)',
    description: 'Real-time bash/powershell process control with command interception',
    category: 'system',
    status: 'connected',
    toolsCount: 3,
    enabled: true,
  },
  {
    id: 'mcp-memory',
    name: 'nous-hermes-memory',
    description: 'Persistent cross-session knowledge, custom skills, and user habits',
    category: 'core',
    status: 'connected',
    toolsCount: 2,
    enabled: true,
  },
  {
    id: 'skill-rea',
    name: 'morluto/rea (Reverse Engineer)',
    description: '6-phase deep reverse engineering protocol for UI, APIs, and workflows',
    category: 'rea',
    status: 'connected',
    toolsCount: 5,
    enabled: true,
  },
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    role: 'user',
    content: 'Can you launch the browser automation to test the login workflow on http://localhost:5173, inspect the form elements, check for errors, and update the button styling in `src/styles/tokens.css`?',
    timestamp: '15:42:10',
    mentions: ['@web', '@file:src/styles/tokens.css'],
  },
  {
    id: 'm-2',
    role: 'assistant',
    content: `I'll execute this across three coordinated steps:
1. **Browser Navigation**: Launch Playwright to inspect \`http://localhost:5173\`, check button elements, and take a screencast snapshot.
2. **Terminal Verification**: Run the build verification command to ensure zero lint errors.
3. **Style Patch**: Update \`src/styles/tokens.css\` with the high-contrast glowing pill border.`,
    timestamp: '15:42:14',
    thought: {
      durationSeconds: 3.2,
      completed: true,
      content: `The user wants to automate a browser test and update token styles:
- Step 1: Tool call browser_navigate to http://localhost:5173.
- Step 2: Use browser_screenshot to capture the current state and verify layout fidelity.
- Step 3: Run command 'npm test' or lint check.
- Step 4: Patch src/styles/tokens.css with the exact frosted-glass pill contour and violet-cyan glow.
I'll format the response with clear tool telemetry and interactive diff cards.`,
    },
    toolCalls: [
      {
        id: 'tc-1',
        name: 'browser_action',
        summary: 'Navigating to http://localhost:5173 & verifying DOM',
        status: 'completed',
        timestamp: '15:42:12',
        durationMs: 820,
        args: {
          action: 'navigate',
          url: 'http://localhost:5173',
          timeout: 10000,
        },
        output: 'Successfully connected via CDP. Page loaded (200 OK). DOM element "#root" mounted in 142ms. 0 console errors.',
        screenshotUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'tc-2',
        name: 'run_command',
        summary: 'Running workspace build check: npx vite build',
        status: 'completed',
        timestamp: '15:42:13',
        durationMs: 410,
        args: {
          command: 'npx vite build',
          cwd: 'c:/Users/ice/Documents/antigravity/agitated-darwin',
        },
        output: `vite v8.3.4 building client environment for production...
✓ 15 modules transformed.
dist/index.html                   1.12 kB │ gzip: 0.61 kB
dist/assets/index-64sKsmJ8.css    8.73 kB │ gzip: 2.72 kB
dist/assets/index-9n2UHqq5.js   220.06 kB │ gzip: 68.85 kB
✓ built in 307ms with 0 errors.`,
      },
      {
        id: 'tc-3',
        name: 'edit_file',
        summary: 'Patching src/styles/tokens.css (Ambient violet-cyan glow)',
        status: 'completed',
        timestamp: '15:42:14',
        durationMs: 120,
        args: {
          file: 'src/styles/tokens.css',
          action: 'replace',
        },
        diff: {
          file: 'src/styles/tokens.css',
          additions: 4,
          deletions: 2,
          chunks: [
            { type: 'context', text: '  --surface-border: rgba(230, 234, 240, 0.06);' },
            { type: 'removed', text: '-  --surface-border-active: rgba(124, 58, 237, 0.45);' },
            { type: 'removed', text: '-  --frosted-glass: blur(12px);' },
            { type: 'added', text: '+  --surface-border-active: rgba(124, 58, 237, 0.85);' },
            { type: 'added', text: '+  --accent-glow: 0 0 24px rgba(6, 182, 212, 0.4);' },
            { type: 'added', text: '+  --frosted-glass: blur(16px);' },
            { type: 'added', text: '+  --pill-contour: 9999px;' },
            { type: 'context', text: '  --radius-panel: 12px;' },
          ],
        },
      },
    ],
  },
];
