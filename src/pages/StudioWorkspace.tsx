import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Code2, 
  Terminal, 
  FileText, 
  PanelRightClose, 
  PanelRightOpen, 
  Maximize2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { ActivityBar } from '../components/rail/ActivityBar';
import { ProjectSwitcher } from '../components/rail/ProjectSwitcher';
import { SessionList } from '../components/rail/SessionList';
import { CronScheduler } from '../components/rail/CronScheduler';
import { McpSkillsManager } from '../components/rail/McpSkillsManager';
import { SettingsModal } from '../components/rail/SettingsModal';
import { MessageStream } from '../components/stream/MessageStream';
import { BrowserViewport } from '../components/inspector/BrowserViewport';
import { MonacoDiffEditor } from '../components/inspector/MonacoDiffEditor';
import { XtermConsole } from '../components/inspector/XtermConsole';
import { ArtifactsRenderer } from '../components/inspector/ArtifactsRenderer';
import { 
  INITIAL_SETTINGS, 
  INITIAL_SESSIONS, 
  INITIAL_CRON_JOBS, 
  INITIAL_MCP_SKILLS, 
  INITIAL_MESSAGES 
} from '../lib/mock-data';
import { TabType, Settings, Session, CronJob, McpSkill, Message, ToolCall } from '../types';
import { wsClient } from '../lib/ws-client';

interface StudioWorkspaceProps {
  onNavigateHome: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({ onNavigateHome }) => {
  // Navigation & Rail state
  const [railTab, setRailTab] = useState<'chat' | 'scheduler' | 'mcp'>('chat');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);

  // Data state
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(INITIAL_SESSIONS[0].id);
  const [cronJobs, setCronJobs] = useState<CronJob[]>(INITIAL_CRON_JOBS);
  const [mcpSkills, setMcpSkills] = useState<McpSkill[]>(INITIAL_MCP_SKILLS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  // Inspector state
  const [inspectorTab, setInspectorTab] = useState<TabType>('browser');
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [browserHeadful, setBrowserHeadful] = useState(false);
  const [inspectorWidth, setInspectorWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Real-time Agent Loop & Security Guard connection
  useEffect(() => {
    wsClient.connect();

    const offThoughtDelta = wsClient.on('agent:thought_delta', (payload: any) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        const currentThought = last.thought?.content || '';
        const newThought = currentThought + (payload?.delta || '');
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            thought: {
              content: newThought,
              durationSeconds: last.thought?.durationSeconds || 1.2,
              completed: false,
            },
          },
        ];
      });
    });

    const offThoughtComplete = wsClient.on('agent:thought_complete', (payload: any) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            thought: {
              content: payload?.thought || last.thought?.content || '',
              durationSeconds: payload?.durationSeconds || 2.4,
              completed: true,
            },
          },
        ];
      });
    });

    const offContentDelta = wsClient.on('agent:content_delta', (payload: any) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            content: (last.content || '') + (payload?.delta || ''),
          },
        ];
      });
    });

    const offAssistantMsg = wsClient.on('agent:assistant_message', (payload: any) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            content: payload?.content || last.content,
          },
        ];
      });
    });

    const offToolCallStart = wsClient.on('agent:tool_call_start', (payload: any) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        const existingCalls = last.toolCalls || [];
        const newCall: ToolCall = {
          id: payload.callId || `tc-${Date.now()}`,
          name: payload.name || 'run_command',
          summary: `Executing ${payload.name || 'tool'}...`,
          status: 'running',
          timestamp: new Date().toLocaleTimeString(),
          args: payload.arguments || {},
        };
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            toolCalls: [...existingCalls, newCall],
          },
        ];
      });
    });

    const offToolCallComplete = wsClient.on('agent:tool_call_complete', (payload: any) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.role !== 'assistant') return prev;
        const existingCalls = (last.toolCalls || []).map((tc) => {
          if (tc.id === payload.callId || tc.name === payload.name) {
            return {
              ...tc,
              status: (payload.result?.status === 'error' ? 'failed' : 'completed') as any,
              output: typeof payload.result === 'string' ? payload.result : JSON.stringify(payload.result?.output || payload.result),
              durationMs: payload.durationMs || 320,
              summary: `${payload.name || tc.name} finished (${payload.result?.status || 'success'})`,
            };
          }
          return tc;
        });
        return [
          ...prev.slice(0, -1),
          {
            ...last,
            toolCalls: existingCalls,
          },
        ];
      });
    });

    const offHitl = wsClient.on('security:hitl_required', (payload: any) => {
      const confirmApproval = window.confirm(
        `[OWASP ASI02 Interceptor] A potentially dangerous command requires approval:\n\nCommand: ${payload.command}\nReasons: ${(payload.reasons || []).join(', ')}\n\nDo you authorize execution?`
      );
      wsClient.resolveHitl(payload.id, confirmApproval);
    });

    return () => {
      offThoughtDelta();
      offThoughtComplete();
      offContentDelta();
      offAssistantMsg();
      offToolCallStart();
      offToolCallComplete();
      offHitl();
    };
  }, []);

  // Handlers
  const handleNewSession = () => {
    const newId = `s-${Date.now()}`;
    const newSession: Session = {
      id: newId,
      title: 'New Autonomous Session',
      timestamp: 'Just now',
      category: 'Today',
      messageCount: 0,
      activeModel: 'Hermes 3 405B (Free)',
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setMessages([]);
  };

  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: `m-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (wsClient.isConnected()) {
      const pendingAssistantMsg: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        thought: {
          durationSeconds: 0.1,
          completed: false,
          content: 'Hermes 3 analyzing task and preparing tool calls...',
        },
        toolCalls: [],
      };
      setMessages((prev) => [...prev, userMsg, pendingAssistantMsg]);
      wsClient.sendAgentMessage(text, { model: settings.model });
    } else {
      // Fallback simulated Hermes 3 agent response if server offline
      const assistantMsg: Message = {
        id: `m-${Date.now() + 1}`,
        role: 'assistant',
        content: `I've analyzed your instruction. Executing browser inspection and terminal check:`,
        timestamp: new Date().toLocaleTimeString(),
        thought: {
          durationSeconds: 1.8,
          completed: true,
          content: `User requested: "${text}".
1. Evaluating tools: Playwright browser automation is required.
2. Invoking browser_action to inspect DOM elements.
3. Checking git status and building verification artifacts.`,
        },
        toolCalls: [
          {
            id: `tc-${Date.now()}`,
            name: 'browser_action',
            summary: 'Executing Playwright navigation & DOM audit',
            status: 'completed',
            timestamp: new Date().toLocaleTimeString(),
            durationMs: 450,
            args: { action: 'navigate', url: 'http://localhost:5173' },
            output: 'Target loaded (200 OK). Captured DOM tree snapshot.',
            screenshotUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          },
        ],
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    }
  };

  const handleToggleCronJob = (id: string) => {
    setCronJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j))
    );
  };

  const handleTriggerCronJob = (id: string) => {
    const job = cronJobs.find((j) => j.id === id);
    if (!job) return;
    handleSendMessage(`[Scheduled Cron Triggered]: ${job.prompt}`);
  };

  const handleToggleMcpSkill = (id: string) => {
    setMcpSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  // Resize handler for Inspector
  const handleMouseDownResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = inspectorWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 360), 800);
      setInspectorWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090a0f] text-[#f1f5f9] select-none font-sans">
      
      {/* COLUMN 1: LEFT RAIL */}
      <ActivityBar
        activeTab={railTab}
        setActiveTab={setRailTab}
        openSettings={() => setSettingsOpen(true)}
        onNavigateHome={onNavigateHome}
        cronCount={cronJobs.filter((j) => j.enabled).length}
        mcpCount={mcpSkills.filter((s) => s.enabled).length}
      />

      <div className="w-64 flex flex-col border-r border-[#e6eaf00f] bg-[#121317] flex-shrink-0">
        <ProjectSwitcher currentProject="free-gravity" />

        {railTab === 'chat' && (
          <SessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
          />
        )}

        {railTab === 'scheduler' && (
          <CronScheduler
            jobs={cronJobs}
            onToggleJob={handleToggleCronJob}
            onTriggerJob={handleTriggerCronJob}
            onAddJob={() => {}}
          />
        )}

        {railTab === 'mcp' && (
          <McpSkillsManager
            skills={mcpSkills}
            onToggleSkill={handleToggleMcpSkill}
          />
        )}
      </div>

      {/* COLUMN 2: CENTER CANVAS (Agent Stream & Input Tray) */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <MessageStream
          session={activeSession}
          messages={messages}
          onSendMessage={handleSendMessage}
          onOpenBrowserTab={() => {
            setInspectorTab('browser');
            setInspectorOpen(true);
          }}
          onAcceptDiff={() => {}}
          onRevertDiff={() => {}}
        />

        {/* Floating toggle button for Inspector if closed */}
        {!inspectorOpen && (
          <button
            onClick={() => setInspectorOpen(true)}
            className="absolute right-4 top-3 z-30 p-2 rounded-xl bg-[#18191d] border border-white/10 text-[#94a3b8] hover:text-white shadow-xl transition-all"
            title="Open Inspector Panel"
          >
            <PanelRightOpen className="w-4 h-4" />
          </button>
        )}
      </main>

      {/* COLUMN 3: RIGHT AUXILIARY INSPECTOR (Browser, Monaco, Term, Artifacts) */}
      {inspectorOpen && (
        <aside
          style={{ width: `${inspectorWidth}px` }}
          className="relative flex flex-col h-full border-l border-[#e6eaf00f] bg-[#0d0e14] flex-shrink-0 z-20"
        >
          {/* Drag Resizer Handle */}
          <div
            onMouseDown={handleMouseDownResize}
            className={`absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-violet-500/40 transition-colors z-30 ${
              isResizing ? 'bg-violet-500/60' : 'bg-transparent'
            }`}
          />

          {/* Inspector Tabs Header */}
          <div className="h-12 bg-[#121317] border-b border-[#e6eaf00f] px-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[
                { id: 'browser', label: 'Browser', icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />, badge: 'LIVE' },
                { id: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5 text-violet-400" /> },
                { id: 'term', label: 'Term', icon: <Terminal className="w-3.5 h-3.5 text-amber-400" /> },
                { id: 'artifacts', label: 'Artifacts', icon: <FileText className="w-3.5 h-3.5 text-emerald-400" /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInspectorTab(tab.id as TabType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    inspectorTab === tab.id
                      ? 'bg-[#1e2026] text-white shadow-sm border border-white/10 font-semibold'
                      : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </button>
              ))}
            </div>

            {/* Close Inspector Button */}
            <button
              onClick={() => setInspectorOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#64748b] hover:text-white transition-colors"
              title="Collapse Inspector"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Inspector Active Pane */}
          <div className="flex-1 overflow-hidden">
            {inspectorTab === 'browser' && (
              <BrowserViewport
                isHeadful={browserHeadful}
                onToggleHeadful={() => setBrowserHeadful(!browserHeadful)}
              />
            )}
            {inspectorTab === 'code' && <MonacoDiffEditor />}
            {inspectorTab === 'term' && <XtermConsole />}
            {inspectorTab === 'artifacts' && <ArtifactsRenderer />}
          </div>
        </aside>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

    </div>
  );
};
