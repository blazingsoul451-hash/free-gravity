/**
 * Free Gravity - Core Server & Message Bus
 * 
 * Express + WebSocket Server (Port 4200)
 * Real-Time Bus connecting Frontend (/app) to:
 *   - server/agent/hermes-loop.ts (Agent Loop Bridge)
 *   - server/mcp/mcp-host.ts (MCP Host Bridge)
 *   - server/browser/playwright-cdp.ts (Playwright CDP Screencast & Browser Actions)
 *   - server/security/owasp-asi-guard.ts (OWASP Top 10 ASI Guard & HITL)
 *   - Interactive Pseudo-Terminal Bridge (node-pty with child_process.spawn fallback)
 */

import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import crypto from 'crypto';

import {
  validateWorkspacePath,
  inspectCommand,
  hitlGuard,
  redactSecrets,
} from './security/owasp-asi-guard.ts';
import type { CommandInspectionResult } from './security/owasp-asi-guard.ts';

import { browserEngine } from './browser/playwright-cdp.ts';
import type { BrowserActionType, TimelineAction } from './browser/playwright-cdp.ts';

// ============================================================================
// Configuration & Constants
// ============================================================================

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4200;
const HOST = process.env.HOST || '0.0.0.0';
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT
  ? path.resolve(process.env.WORKSPACE_ROOT)
  : process.cwd();

// ============================================================================
// Terminal Bridge Types & Session Manager
// ============================================================================

interface TerminalSession {
  id: string;
  isPty: boolean;
  process: any; // node-pty IPty instance or ChildProcess
  cwd: string;
  inputBuffer: string;
  pendingApproval?: {
    requestId: string;
    command: string;
  };
}

class TerminalBridge extends EventEmitter {
  private sessions = new Map<string, TerminalSession>();
  private ptyModule: any = null;
  private hasCheckedPty = false;

  private async loadPty(): Promise<any> {
    if (this.hasCheckedPty) return this.ptyModule;
    this.hasCheckedPty = true;
    try {
      // @ts-ignore dynamic import
      const pty = await import('node-pty');
      this.ptyModule = pty.default || pty;
      return this.ptyModule;
    } catch {
      this.ptyModule = null;
      return null;
    }
  }

  public async createSession(
    sessionId?: string,
    options?: { cols?: number; rows?: number; cwd?: string }
  ): Promise<string> {
    const id = sessionId || `term-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const cols = options?.cols || 80;
    const rows = options?.rows || 24;
    const cwd = options?.cwd || WORKSPACE_ROOT;

    const pty = await this.loadPty();
    const isWindows = process.platform === 'win32';
    const shell = isWindows
      ? (process.env.COMSPEC || 'powershell.exe')
      : (process.env.SHELL || '/bin/bash');

    if (pty) {
      try {
        const ptyProcess = pty.spawn(shell, [], {
          name: 'xterm-256color',
          cols,
          rows,
          cwd,
          env: process.env as Record<string, string>,
        });

        const session: TerminalSession = {
          id,
          isPty: true,
          process: ptyProcess,
          cwd,
          inputBuffer: '',
        };

        ptyProcess.onData((data: string) => {
          // Secret Redaction on terminal output stream
          const sanitized = redactSecrets(data);
          this.emit('data', { sessionId: id, data: sanitized });
        });

        ptyProcess.onExit((exitCode: { exitCode: number; signal?: number }) => {
          this.sessions.delete(id);
          this.emit('exit', { sessionId: id, code: exitCode.exitCode });
        });

        this.sessions.set(id, session);
        return id;
      } catch (err) {
        console.warn('[Terminal] node-pty spawn failed, falling back to child_process.spawn');
      }
    }

    // Fallback: standard child_process.spawn
    const fallbackProcess = spawn(shell, isWindows ? [] : ['-i'], {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    const session: TerminalSession = {
      id,
      isPty: false,
      process: fallbackProcess,
      cwd,
      inputBuffer: '',
    };

    fallbackProcess.stdout?.on('data', (chunk: Buffer) => {
      const sanitized = redactSecrets(chunk.toString('utf-8'));
      this.emit('data', { sessionId: id, data: sanitized });
    });

    fallbackProcess.stderr?.on('data', (chunk: Buffer) => {
      const sanitized = redactSecrets(chunk.toString('utf-8'));
      this.emit('data', { sessionId: id, data: sanitized });
    });

    fallbackProcess.on('close', (code: number) => {
      this.sessions.delete(id);
      this.emit('exit', { sessionId: id, code: code ?? 0 });
    });

    this.sessions.set(id, session);
    return id;
  }

  public writeInput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Accumulate buffer to intercept dangerous commands on newline
    if (data.includes('\r') || data.includes('\n')) {
      const fullCmd = (session.inputBuffer + data).replace(/[\r\n]+/g, '').trim();
      session.inputBuffer = '';

      if (fullCmd) {
        // OWASP ASI02 Destructive Command Interceptor Check
        const inspection = inspectCommand(fullCmd);
        if (inspection.requiresHITL) {
          this.handleHitlIntercept(session, fullCmd, inspection, data);
          return;
        }
      }
    } else {
      // Backspace handler for buffer
      if (data === '\x7f' || data === '\b') {
        session.inputBuffer = session.inputBuffer.slice(0, -1);
      } else {
        session.inputBuffer += data;
      }
    }

    this.rawWrite(session, data);
  }

  private async handleHitlIntercept(
    session: TerminalSession,
    cmd: string,
    inspection: CommandInspectionResult,
    originalData: string
  ): Promise<void> {
    const warningNotice = `\r\n\x1b[33m[OWASP ASI02 GUARD] Intercepted potentially dangerous command: "${cmd}"\x1b[0m\r\n\x1b[33mReason: ${inspection.reasons.join(', ')}\x1b[0m\r\n\x1b[36mAwaiting Human-in-the-Loop (HITL) approval via Free Gravity UI...\x1b[0m\r\n`;
    this.emit('data', { sessionId: session.id, data: warningNotice });

    const approved = await hitlGuard.requestApproval(cmd, inspection, {
      sessionId: session.id,
      source: 'terminal',
    });

    if (approved) {
      const approvalNotice = `\r\n\x1b[32m[OWASP ASI02 GUARD] HITL approval granted by user. Executing command...\x1b[0m\r\n`;
      this.emit('data', { sessionId: session.id, data: approvalNotice });
      this.rawWrite(session, originalData);
    } else {
      const rejectNotice = `\r\n\x1b[31m[OWASP ASI02 GUARD] HITL approval rejected or timed out. Command blocked.\x1b[0m\r\n`;
      this.emit('data', { sessionId: session.id, data: rejectNotice });
    }
  }

  private rawWrite(session: TerminalSession, data: string): void {
    if (session.isPty) {
      session.process.write(data);
    } else if (session.process.stdin && !session.process.stdin.destroyed) {
      session.process.stdin.write(data);
    }
  }

  public resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session && session.isPty && typeof session.process.resize === 'function') {
      try {
        session.process.resize(cols, rows);
      } catch {
        // Ignore resize error if closed
      }
    }
  }

  public kill(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      if (session.isPty) {
        session.process.kill();
      } else {
        session.process.kill('SIGTERM');
      }
    } catch {
      // Ignore kill error
    }
    this.sessions.delete(sessionId);
  }

  public killAll(): void {
    for (const [id] of this.sessions) {
      this.kill(id);
    }
  }
}

const terminalBridge = new TerminalBridge();

// ============================================================================
// Dynamic Module Loaders (Chat 2 Integration Adapters)
// ============================================================================

interface AgentLoopAdapter {
  isAvailable: boolean;
  rawAgent?: any;
  startAgent?: (options: any) => Promise<any>;
  stopAgent?: (runId: string) => Promise<any>;
  sendMessage?: (message: string) => Promise<any>;
}

interface MCPHostAdapter {
  isAvailable: boolean;
  rawHost?: any;
  listTools?: () => Promise<any>;
  callTool?: (toolName: string, args: any) => Promise<any>;
  getStatus?: () => Promise<any>;
}

let agentLoopAdapter: AgentLoopAdapter = { isAvailable: false };
let mcpHostAdapter: MCPHostAdapter = { isAvailable: false };

/**
 * Dynamically hooks Chat 2's hermes-loop and mcp-host once they exist.
 */
async function loadChat2Adapters(): Promise<void> {
  // Check hermes-loop
  const agentPath = path.join(process.cwd(), 'server', 'agent', 'hermes-loop.ts');
  const agentPathJs = path.join(process.cwd(), 'server', 'agent', 'hermes-loop.js');

  if (fs.existsSync(agentPath) || fs.existsSync(agentPathJs)) {
    try {
      let agentModule: any;
      try {
        // @ts-ignore dynamic import
        agentModule = await import('./agent/hermes-loop.ts');
      } catch {
        // @ts-ignore dynamic import
        agentModule = await import('./agent/hermes-loop.js');
      }
      agentLoopAdapter = {
        isAvailable: true,
        rawAgent: agentModule.defaultAgent || agentModule.hermesAgent,
        ...agentModule,
      };
      console.log('[Free Gravity Server] Successfully hooked server/agent/hermes-loop.ts');
    } catch (err: any) {
      console.warn('[Free Gravity Server] Chat 2 hermes-loop found but loading delayed:', err.message);
    }
  } else {
    console.log('[Free Gravity Server] hermes-loop.ts not present yet - running stub-safe agent bridge');
  }

  // Check mcp-host
  const mcpPath = path.join(process.cwd(), 'server', 'mcp', 'mcp-host.ts');
  const mcpPathJs = path.join(process.cwd(), 'server', 'mcp', 'mcp-host.js');

  if (fs.existsSync(mcpPath) || fs.existsSync(mcpPathJs)) {
    try {
      let mcpModule: any;
      try {
        // @ts-ignore dynamic import
        mcpModule = await import('./mcp/mcp-host.ts');
      } catch {
        // @ts-ignore dynamic import
        mcpModule = await import('./mcp/mcp-host.js');
      }
      mcpHostAdapter = {
        isAvailable: true,
        rawHost: mcpModule.defaultMcpHost || mcpModule.mcpHost,
        ...mcpModule,
      };
      console.log('[Free Gravity Server] Successfully hooked server/mcp/mcp-host.ts');
    } catch (err: any) {
      console.warn('[Free Gravity Server] Chat 2 mcp-host found but loading delayed:', err.message);
    }
  } else {
    console.log('[Free Gravity Server] mcp-host.ts not present yet - running stub-safe MCP bridge');
  }
}

// ============================================================================
// Express & HTTP Request Handler
// ============================================================================

async function createHttpApp(): Promise<{ app: any; server: http.Server }> {
  let expressApp: any = null;

  try {
    // @ts-ignore dynamic import
    const expressModule = await import('express');
    const express = expressModule.default || expressModule;
    expressApp = express();

    // CORS & JSON middleware
    expressApp.use((req: any, res: any, next: any) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    expressApp.use(express.json({ limit: '50mb' }));
    expressApp.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // REST Health & Subsystem Status
    expressApp.get(['/health', '/api/health'], (req: any, res: any) => {
      res.json({
        status: 'ok',
        mode: 'local-first',
        version: '1.0.0',
        uptime: process.uptime(),
        timestamp: Date.now(),
        services: {
          security: 'active',
          browser: 'ready',
          websocket: 'listening',
          terminal: 'ready',
          agentLoop: agentLoopAdapter.isAvailable ? 'connected' : 'standby',
          mcpHost: mcpHostAdapter.isAvailable ? 'connected' : 'standby',
        },
      });
    });

    // System & Workspace Configuration
    expressApp.get('/api/config', (req: any, res: any) => {
      res.json({
        workspaceRoot: WORKSPACE_ROOT,
        port: PORT,
        host: HOST,
        security: {
          hitlRequired: true,
          secretRedaction: true,
          jailing: true,
        },
        browser: {
          isTakeoverActive: browserEngine.isTakeoverActive(),
          currentUrl: browserEngine.getPageUrl(),
        },
      });
    });

    // Security HITL Endpoints
    expressApp.get('/api/security/hitl/pending', (req: any, res: any) => {
      res.json({ pending: hitlGuard.getPendingRequests() });
    });

    expressApp.post('/api/security/hitl', (req: any, res: any) => {
      const { requestId, approved, approver } = req.body || {};
      if (!requestId || typeof approved !== 'boolean') {
        return res.status(400).json({ error: 'Missing requestId or approved boolean.' });
      }
      const resolved = hitlGuard.resolveApproval(requestId, approved, approver || 'user');
      res.json({ success: resolved, requestId, approved });
    });

    expressApp.post('/api/security/validate-path', (req: any, res: any) => {
      const { targetPath, workspaceRoot } = req.body || {};
      const result = validateWorkspacePath(targetPath, workspaceRoot || WORKSPACE_ROOT);
      res.json(result);
    });

    expressApp.post('/api/security/inspect-command', (req: any, res: any) => {
      const { command } = req.body || {};
      const result = inspectCommand(command || '');
      res.json(result);
    });

    // Browser Actions & Takeover REST Endpoints
    expressApp.post('/api/browser/action', async (req: any, res: any) => {
      try {
        const { action, ...params } = req.body || {};
        let result: any = null;

        switch (action as BrowserActionType) {
          case 'navigate':
            result = await browserEngine.navigate(params.url, params.options);
            break;
          case 'click':
            result = await browserEngine.click(params.target, params.options);
            break;
          case 'type':
            result = await browserEngine.type(params.selector, params.text, params.options);
            break;
          case 'scroll':
            result = await browserEngine.scroll(params.options);
            break;
          case 'screenshot':
            result = await browserEngine.screenshot(params.options);
            break;
          case 'extractDom':
            result = await browserEngine.extractSanitizedDom();
            break;
          default:
            return res.status(400).json({ error: `Unknown browser action: ${action}` });
        }

        res.json({ success: true, result });
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    expressApp.post('/api/browser/takeover', async (req: any, res: any) => {
      const { action } = req.body || {};
      try {
        if (action === 'start') {
          const result = await browserEngine.triggerHumanTakeover();
          res.json({ success: true, ...result });
        } else if (action === 'resume') {
          const result = await browserEngine.resumeAgentControl();
          res.json({ success: true, ...result });
        } else {
          res.status(400).json({ error: 'Action must be "start" or "resume"' });
        }
      } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
      }
    });

    expressApp.get('/api/browser/timeline', (req: any, res: any) => {
      res.json({ timeline: browserEngine.getTimeline() });
    });

    expressApp.get('/api/browser/status', (req: any, res: any) => {
      res.json({
        isTakeoverActive: browserEngine.isTakeoverActive(),
        currentUrl: browserEngine.getPageUrl(),
      });
    });

    // Static Frontend Serving for /app or dist
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      expressApp.use(express.static(distPath));
      expressApp.get('*', (req: any, res: any) => {
        const indexHtml = path.join(distPath, 'index.html');
        if (fs.existsSync(indexHtml)) {
          res.sendFile(indexHtml);
        } else {
          res.send('Free Gravity Server Running. Frontend dist found.');
        }
      });
    } else {
      expressApp.get('/', (req: any, res: any) => {
        res.send('<h1>Free Gravity Local Server</h1><p>Running on Port 4200. Open Frontend UI on Vite dev server.</p>');
      });
    }

    const server = http.createServer(expressApp);
    return { app: expressApp, server };
  } catch (err) {
    // Native HTTP server fallback if express is not yet installed in node_modules
    console.log('[Free Gravity Server] Express module not available yet, using native HTTP server.');

    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost:4200'}`);

      if (parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            mode: 'local-first',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: Date.now(),
            services: { security: 'active', browser: 'ready', websocket: 'listening' },
          })
        );
        return;
      }

      if (parsedUrl.pathname === '/api/config') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            workspaceRoot: WORKSPACE_ROOT,
            port: PORT,
            security: { hitlRequired: true, secretRedaction: true, jailing: true },
          })
        );
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Free Gravity Local Server</h1><p>Running on Port 4200.</p>');
    });

    return { app: null, server };
  }
}

// ============================================================================
// Real-Time WebSocket Message Bus
// ============================================================================

interface WSMessage {
  type: string;
  payload?: any;
  requestId?: string;
  channel?: string;
}

async function attachWebSocketBus(httpServer: http.Server): Promise<any> {
  let WebSocketServerClass: any = null;

  try {
    // @ts-ignore dynamic import
    const wsModule = await import('ws');
    WebSocketServerClass = wsModule.WebSocketServer || wsModule.default?.WebSocketServer || wsModule.default;
  } catch {
    console.warn('[Free Gravity Server] ws package not installed yet. WebSocket bus will initialize once packages are installed.');
    return null;
  }

  const wss = new WebSocketServerClass({ server: httpServer });
  const screencastSubscribers = new Set<any>();

  // Broadcast helper
  const broadcast = (type: string, payload?: any, channel?: string) => {
    const raw = JSON.stringify({ type, payload, channel, timestamp: Date.now() });
    for (const client of wss.clients) {
      if (client.readyState === 1 /* OPEN */) {
        client.send(raw);
      }
    }
  };

  // Wire OWASP ASI Guard HITL events
  hitlGuard.on('hitl_required', (req) => {
    broadcast('security:hitl_required', req, 'security');
  });

  hitlGuard.on('hitl_resolved', (req) => {
    broadcast('security:hitl_resolved', req, 'security');
  });

  // Wire Browser CDP events
  browserEngine.on('frame', (frameData) => {
    const raw = JSON.stringify({ type: 'browser:frame', payload: frameData, channel: 'browser' });
    for (const client of screencastSubscribers) {
      if (client.readyState === 1 /* OPEN */) {
        client.send(raw);
      }
    }
  });

  browserEngine.on('timeline_update', (action: TimelineAction) => {
    broadcast('browser:timeline_update', action, 'browser');
  });

  browserEngine.on('human_takeover_started', (info) => {
    broadcast('browser:takeover_started', info, 'browser');
  });

  browserEngine.on('human_takeover_resumed', (info) => {
    broadcast('browser:takeover_resumed', info, 'browser');
  });

  // Wire Terminal bridge events
  terminalBridge.on('data', ({ sessionId, data }) => {
    broadcast('terminal:data', { sessionId, data }, 'terminal');
  });

  terminalBridge.on('exit', ({ sessionId, code }) => {
    broadcast('terminal:exit', { sessionId, code }, 'terminal');
  });

  // Wire Hermes 3 Agent Loop ReAct streaming events
  if (agentLoopAdapter.isAvailable && agentLoopAdapter.rawAgent) {
    const agent = agentLoopAdapter.rawAgent;
    agent.on('thought_delta', (data: any) => broadcast('agent:thought_delta', data, 'agent'));
    agent.on('thought_complete', (data: any) => broadcast('agent:thought_complete', data, 'agent'));
    agent.on('assistant_content_delta', (data: any) => broadcast('agent:content_delta', data, 'agent'));
    agent.on('tool_call_start', (data: any) => broadcast('agent:tool_call_start', data, 'agent'));
    agent.on('tool_call_output', (data: any) => broadcast('agent:tool_call_output', data, 'agent'));
    agent.on('tool_call_complete', (data: any) => broadcast('agent:tool_call_complete', data, 'agent'));
    agent.on('agent_start', (data: any) => broadcast('agent:start', data, 'agent'));
    agent.on('agent_step_start', (data: any) => broadcast('agent:step_start', data, 'agent'));
    agent.on('agent_step_end', (data: any) => broadcast('agent:step_end', data, 'agent'));
    agent.on('assistant_message', (data: any) => broadcast('agent:assistant_message', data, 'agent'));
    agent.on('agent_complete', (data: any) => broadcast('agent:complete', data, 'agent'));
    agent.on('agent_error', (data: any) => broadcast('agent:error', data, 'agent'));
    agent.on('agent_timeout', (data: any) => broadcast('agent:timeout', data, 'agent'));
    agent.on('tool_call_invalid', (data: any) => broadcast('agent:tool_call_invalid', data, 'agent'));
    agent.on('skill_learned', (data: any) => broadcast('agent:skill_learned', data, 'agent'));
  }

  // Client connection handler
  wss.on('connection', (ws: any) => {
    const clientId = crypto.randomUUID();

    // Send connection greeting
    ws.send(
      JSON.stringify({
        type: 'server:connected',
        payload: {
          clientId,
          version: '1.0.0',
          workspaceRoot: WORKSPACE_ROOT,
          services: {
            security: true,
            browser: true,
            terminal: true,
            agentLoop: agentLoopAdapter.isAvailable,
            mcpHost: mcpHostAdapter.isAvailable,
          },
        },
      })
    );

    ws.on('message', async (data: any) => {
      let msg: WSMessage;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', payload: 'Invalid JSON message payload.' }));
        return;
      }

      const { type, payload, requestId } = msg;

      try {
        switch (type) {
          // ------------------------------------------------------------------
          // Browser CDP Screencast & Actions
          // ------------------------------------------------------------------
          case 'browser:start_screencast': {
            screencastSubscribers.add(ws);
            await browserEngine.startScreencast();
            ws.send(JSON.stringify({ type: 'browser:screencast_active', requestId, payload: { active: true } }));
            break;
          }

          case 'browser:stop_screencast': {
            screencastSubscribers.delete(ws);
            await browserEngine.stopScreencast();
            ws.send(JSON.stringify({ type: 'browser:screencast_active', requestId, payload: { active: false } }));
            break;
          }

          case 'browser:action': {
            const { action, ...actionParams } = payload || {};
            let result: any = null;

            switch (action as BrowserActionType) {
              case 'navigate':
                result = await browserEngine.navigate(actionParams.url, actionParams.options);
                break;
              case 'click':
                result = await browserEngine.click(actionParams.target, actionParams.options);
                break;
              case 'type':
                result = await browserEngine.type(actionParams.selector, actionParams.text, actionParams.options);
                break;
              case 'scroll':
                result = await browserEngine.scroll(actionParams.options);
                break;
              case 'screenshot':
                result = await browserEngine.screenshot(actionParams.options);
                break;
              case 'extractDom':
                result = await browserEngine.extractSanitizedDom();
                break;
              default:
                throw new Error(`Unsupported browser action: ${action}`);
            }

            ws.send(JSON.stringify({ type: 'browser:action_result', requestId, payload: { success: true, result } }));
            break;
          }

          case 'browser:takeover_start': {
            const result = await browserEngine.triggerHumanTakeover();
            ws.send(JSON.stringify({ type: 'browser:takeover_result', requestId, payload: result }));
            break;
          }

          case 'browser:takeover_resume': {
            const result = await browserEngine.resumeAgentControl();
            ws.send(JSON.stringify({ type: 'browser:takeover_result', requestId, payload: result }));
            break;
          }

          // ------------------------------------------------------------------
          // Security HITL & Jailing
          // ------------------------------------------------------------------
          case 'security:hitl_response': {
            const { requestId: reqId, approved, approver } = payload || {};
            const success = hitlGuard.resolveApproval(reqId, approved, approver || 'user');
            ws.send(JSON.stringify({ type: 'security:hitl_ack', requestId, payload: { success, reqId, approved } }));
            break;
          }

          case 'security:validate_path': {
            const { targetPath, workspaceRoot } = payload || {};
            const result = validateWorkspacePath(targetPath, workspaceRoot || WORKSPACE_ROOT);
            ws.send(JSON.stringify({ type: 'security:validate_path_result', requestId, payload: result }));
            break;
          }

          case 'security:inspect_cmd': {
            const { cmd } = payload || {};
            const result = inspectCommand(cmd || '');
            ws.send(JSON.stringify({ type: 'security:inspect_cmd_result', requestId, payload: result }));
            break;
          }

          // ------------------------------------------------------------------
          // Terminal Bridge
          // ------------------------------------------------------------------
          case 'terminal:create': {
            const termId = await terminalBridge.createSession(payload?.sessionId, payload?.options);
            ws.send(JSON.stringify({ type: 'terminal:created', requestId, payload: { sessionId: termId } }));
            break;
          }

          case 'terminal:input': {
            const { sessionId, data: termData } = payload || {};
            if (sessionId && termData !== undefined) {
              terminalBridge.writeInput(sessionId, termData);
            }
            break;
          }

          case 'terminal:resize': {
            const { sessionId, cols, rows } = payload || {};
            if (sessionId && cols && rows) {
              terminalBridge.resize(sessionId, cols, rows);
            }
            break;
          }

          case 'terminal:kill': {
            const { sessionId } = payload || {};
            if (sessionId) {
              terminalBridge.kill(sessionId);
            }
            break;
          }

          // ------------------------------------------------------------------
          // Agent Loop Bridge (hermes-loop.ts)
          // ------------------------------------------------------------------
          case 'agent:run':
          case 'agent:start':
          case 'agent:message': {
            if (agentLoopAdapter.isAvailable && agentLoopAdapter.rawAgent) {
              const userPrompt = payload?.prompt || payload?.message || '';
              agentLoopAdapter.rawAgent
                .run(userPrompt, payload?.options)
                .then((res: any) => {
                  ws.send(JSON.stringify({ type: 'agent:response', requestId, payload: res }));
                })
                .catch((err: any) => {
                  ws.send(JSON.stringify({ type: 'agent:error', requestId, payload: { error: err.message } }));
                });
            } else {
              ws.send(
                JSON.stringify({
                  type: 'agent:status',
                  requestId,
                  payload: {
                    status: 'standby',
                    message: 'Chat 2 hermes-loop is in standby.',
                  },
                })
              );
            }
            break;
          }

          // ------------------------------------------------------------------
          // MCP Host Bridge (mcp-host.ts)
          // ------------------------------------------------------------------
          case 'mcp:list_tools':
          case 'mcp:call_tool':
          case 'mcp:status': {
            if (mcpHostAdapter.isAvailable && mcpHostAdapter.rawHost) {
              if (type === 'mcp:list_tools') {
                const tools = typeof mcpHostAdapter.rawHost.getHermesToolDefinitions === 'function'
                  ? mcpHostAdapter.rawHost.getHermesToolDefinitions()
                  : mcpHostAdapter.rawHost.getTools();
                ws.send(JSON.stringify({ type: 'mcp:tools_list', requestId, payload: tools }));
              } else if (type === 'mcp:call_tool') {
                const result = await mcpHostAdapter.rawHost.executeTool(payload?.toolName, payload?.args);
                ws.send(JSON.stringify({ type: 'mcp:tool_result', requestId, payload: result }));
              } else {
                ws.send(JSON.stringify({ type: 'mcp:status_result', requestId, payload: { status: 'ready' } }));
              }
            } else {
              ws.send(
                JSON.stringify({
                  type: 'mcp:status_result',
                  requestId,
                  payload: {
                    status: 'standby',
                    message: 'Chat 2 mcp-host is in standby.',
                  },
                })
              );
            }
            break;
          }

          default:
            ws.send(
              JSON.stringify({
                type: 'unknown_message',
                requestId,
                payload: { unhandledType: type },
              })
            );
        }
      } catch (err: any) {
        ws.send(
          JSON.stringify({
            type: 'error',
            requestId,
            payload: { message: err.message, stack: err.stack },
          })
        );
      }
    });

    ws.on('close', () => {
      screencastSubscribers.delete(ws);
      if (screencastSubscribers.size === 0) {
        browserEngine.stopScreencast().catch(() => {});
      }
    });
  });

  return wss;
}

// ============================================================================
// Server Bootstrap & Lifecycle Management
// ============================================================================

export async function startServer(): Promise<{ server: http.Server; wss: any }> {
  // Check for Chat 2 modules
  await loadChat2Adapters();

  const { server } = await createHttpApp();
  const wss = await attachWebSocketBus(server);

  return new Promise((resolve) => {
    server.listen(PORT, HOST, () => {
      console.log(`\n======================================================`);
      console.log(` Free Gravity Server v1.0.0 (Local-First Agentic IDE)`);
      console.log(` Port: ${PORT} | Host: ${HOST}`);
      console.log(` Workspace Root: ${WORKSPACE_ROOT}`);
      console.log(` Security Guard: OWASP Top 10 ASI05 / ASI02 / ASI01 Active`);
      console.log(` Browser Engine: Playwright CDP Screencast Ready`);
      console.log(` Terminal: Interactive Pty Bridge Ready`);
      console.log(`======================================================\n`);
      resolve({ server, wss });
    });
  });
}

// Graceful process shutdown
async function gracefulShutdown(): Promise<void> {
  console.log('\n[Free Gravity Server] Initiating graceful shutdown...');
  terminalBridge.killAll();
  await browserEngine.close();
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Run directly if invoked as main module
startServer().catch((err) => {
  console.error('[Free Gravity Server] Failed to start:', err);
});
