export type TabType = 'browser' | 'code' | 'term' | 'artifacts';

export interface ToolCall {
  id: string;
  name: 'run_command' | 'browser_action' | 'edit_file' | 'schedule' | 'rea_analyze' | (string & {});
  summary: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: string;
  durationMs?: number;
  args: Record<string, any>;
  output?: string;
  diff?: {
    file: string;
    additions: number;
    deletions: number;
    chunks: Array<{ type: 'added' | 'removed' | 'context'; text: string }>;
  };
  screenshotUrl?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  thought?: {
    content: string;
    durationSeconds: number;
    completed: boolean;
  };
  toolCalls?: ToolCall[];
  mentions?: string[];
}

export interface Session {
  id: string;
  title: string;
  timestamp: string;
  category: 'Today' | 'Yesterday' | 'Older';
  messageCount: number;
  activeModel: string;
  unread?: boolean;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
}

export interface McpSkill {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'browser' | 'system' | 'rea';
  status: 'connected' | 'idle' | 'disabled';
  toolsCount: number;
  enabled: boolean;
}

export interface Settings {
  provider: 'omniroute' | 'openrouter' | 'ollama';
  apiKey: string;
  model: string;
  customEndpoint: string;
  temperature: number;
  systemPrompt: string;
  sandboxing: 'owasp_jailing' | 'docker' | 'none';
  hitlInterceptor: boolean;
  browserMode: 'headless' | 'headful';
}
