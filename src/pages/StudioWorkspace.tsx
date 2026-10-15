import React, { useState, useEffect } from 'react';
import { AntigravityTopBar } from '../components/studio/AntigravityTopBar';
import { AntigravitySidebar, SidebarConversation } from '../components/studio/AntigravitySidebar';
import { AntigravityAuxiliaryPane, AuxiliaryTab } from '../components/studio/AntigravityAuxiliaryPane';
import { MessageStream, StreamItem } from '../components/stream/MessageStream';
import { SettingsModal } from '../components/rail/SettingsModal';
import { CronScheduler } from '../components/rail/CronScheduler';
import { McpSkillsManager } from '../components/rail/McpSkillsManager';
import { 
  INITIAL_SETTINGS, 
  INITIAL_CRON_JOBS, 
  INITIAL_MCP_SKILLS 
} from '../lib/mock-data';
import { Settings, CronJob, McpSkill } from '../types';
import { wsClient } from '../lib/ws-client';

interface StudioWorkspaceProps {
  onNavigateHome: () => void;
}

const INITIAL_CONVERSATIONS: SidebarConversation[] = [
  {
    id: 'conv-1',
    project: 'FREE GRAVITY PROJECT',
    title: 'Chat Plan Feasibility Check',
    time: 'Just now',
    isLoading: false,
  },
  {
    id: 'conv-2',
    project: 'FREE GRAVITY PROJECT',
    title: 'Build Free Gravity App',
    time: '42m',
  },
  {
    id: 'conv-3',
    project: 'FREE GRAVITY PROJECT',
    title: 'Building Server Security and B...',
    time: '22h',
  },
  {
    id: 'conv-4',
    project: 'FREE GRAVITY PROJECT',
    title: 'Agent And MCP Server Imple...',
    time: '22h',
  },
  {
    id: 'conv-5',
    project: 'FREE GRAVITY PROJECT',
    title: 'Free Gravity Showcase And SDK',
    time: '22h',
  },
  {
    id: 'conv-6',
    project: 'OCTAL DIALER PROJECT',
    title: 'Frontend UI Design Refactor',
    time: '1h',
    hasDot: true,
  },
  {
    id: 'conv-7',
    project: 'OCTAL DIALER PROJECT',
    title: 'New Octal Dialer Project',
    time: '22h',
  },
  {
    id: 'conv-8',
    project: 'OCTAL DIALER PROJECT',
    title: 'App Development Project Ma...',
    time: '23h',
  },
];

const INITIAL_ITEMS_CONV1: StreamItem[] = [
  {
    id: 'it-1',
    type: 'task',
    text: 'Checked task Download Google Fonts CSS',
  },
  {
    id: 'it-2',
    type: 'task',
    text: 'Download Google Fonts CSS finished',
  },
  {
    id: 'it-3',
    type: 'analyze',
    text: 'Analyzed',
    filename: 'google-fonts.css',
    lines: '#L1-60',
  },
  {
    id: 'it-4',
    type: 'thought',
    text: 'Thought for 11s',
    durationSeconds: 11,
    details: 'Evaluating font links and loading Google Sans Flex and Google Sans Text into stylesheets...',
  },
  {
    id: 'it-5',
    type: 'analyze',
    text: 'Analyzed',
    filename: 'index.html',
    lines: '#L1-22',
  },
  {
    id: 'it-6',
    type: 'thought',
    text: 'Thought for 19s',
    durationSeconds: 19,
    details: 'Injecting Google Sans and Google Sans Code to match exact Antigravity typography.',
  },
  {
    id: 'it-7',
    type: 'edit',
    text: 'Edited',
    filename: 'tokens.css',
    additions: 100,
    deletions: 70,
  },
  {
    id: 'it-8',
    type: 'edit',
    text: 'Edited',
    filename: 'index.html',
    additions: 2,
    deletions: 2,
  },
  {
    id: 'it-9',
    type: 'task',
    text: 'Verify build with updated fonts',
  },
  {
    id: 'it-10',
    type: 'task',
    text: 'Checked task Verify build with updated fonts',
  },
  {
    id: 'it-11',
    type: 'task',
    text: 'Verify build with updated fonts finished',
  },
];

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({ onNavigateHome }) => {
  // Navigation & Dialog states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [customizationsOpen, setCustomizationsOpen] = useState(false);

  // Conversations & Projects state
  const [conversations, setConversations] = useState<SidebarConversation[]>(INITIAL_CONVERSATIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('conv-1');

  // Mapping conversation IDs to stream items
  const [sessionStreams, setSessionStreams] = useState<Record<string, StreamItem[]>>({
    'conv-1': INITIAL_ITEMS_CONV1,
    'conv-2': [],
    'conv-3': [],
    'conv-4': [],
    'conv-5': [],
    'conv-6': [],
    'conv-7': [],
    'conv-8': [],
  });

  // Background jobs & MCP skills
  const [cronJobs, setCronJobs] = useState<CronJob[]>(INITIAL_CRON_JOBS);
  const [mcpSkills, setMcpSkills] = useState<McpSkill[]>(INITIAL_MCP_SKILLS);

  // Right Auxiliary Inspector state
  const [auxiliaryOpen, setAuxiliaryOpen] = useState(true);
  const [auxiliaryTab, setAuxiliaryTab] = useState<AuxiliaryTab>('overview');
  const [auxiliaryWidth, setAuxiliaryWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);

  const activeConversation =
    conversations.find((c) => c.id === activeSessionId) || conversations[0];

  const currentStreamItems = sessionStreams[activeSessionId] || [];

  // Real-time Agent Loop & Security Guard connection
  useEffect(() => {
    wsClient.connect();

    const offHitl = wsClient.on('security:hitl_required', (payload: any) => {
      const confirmApproval = window.confirm(
        `[OWASP ASI02 Interceptor] Potentially destructive command requires approval:\n\nCommand: ${payload.command}\nReasons: ${(payload.reasons || []).join(', ')}\n\nAuthorize execution?`
      );
      wsClient.resolveHitl(payload.id, confirmApproval);
    });

    return () => {
      offHitl();
    };
  }, []);

  // Handlers
  const handleNewSession = () => {
    const newId = `conv-${Date.now()}`;
    const newConv: SidebarConversation = {
      id: newId,
      project: 'FREE GRAVITY PROJECT',
      title: 'New Conversation',
      time: 'Just now',
      isLoading: false,
    };
    setConversations([newConv, ...conversations]);
    setSessionStreams((prev) => ({
      ...prev,
      [newId]: [], // Start completely clean & empty!
    }));
    setActiveSessionId(newId);
  };

  const handleSendMessage = (text: string) => {
    const userMsgId = `it-${Date.now()}`;
    const userItem: StreamItem = {
      id: userMsgId,
      type: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    const workingItem: StreamItem = {
      id: `it-${Date.now() + 1}`,
      type: 'working',
      text: 'Working',
    };

    // Update conversation title if it was 'New Conversation'
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeSessionId && c.title === 'New Conversation') {
          const shortTitle = text.length > 28 ? text.slice(0, 26) + '...' : text;
          return { ...c, title: shortTitle };
        }
        return c;
      })
    );

    // Add user item + working item
    setSessionStreams((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), userItem, workingItem],
    }));

    // Trigger backend websocket if connected
    if (wsClient.isConnected()) {
      wsClient.sendAgentMessage(text, { model: settings.model });
    }

    // Determine what comes after what based on prompt content
    const lower = text.toLowerCase();
    setTimeout(() => {
      const toolItems: StreamItem[] = [];

      if (lower.includes('browser') || lower.includes('navigate') || lower.includes('audit')) {
        setAuxiliaryTab('browser');
        toolItems.push({
          id: `it-${Date.now() + 2}`,
          type: 'task',
          text: 'Playwright CDP session initialized on port 9222',
        });
        toolItems.push({
          id: `it-${Date.now() + 3}`,
          type: 'analyze',
          text: 'Analyzed',
          filename: 'http://localhost:5173',
          lines: 'DOM snapshot captured',
        });
      } else if (lower.includes('plan') || lower.includes('architect')) {
        setAuxiliaryTab('artifacts');
        toolItems.push({
          id: `it-${Date.now() + 2}`,
          type: 'artifact',
          text: 'free-gravity-arch-plan.md',
          artifactName: 'free-gravity-arch-plan.md (Artifact v1.0)',
        });
      } else if (lower.includes('test') || lower.includes('build') || lower.includes('compile')) {
        setAuxiliaryTab('terminal');
        toolItems.push({
          id: `it-${Date.now() + 2}`,
          type: 'task',
          text: 'Checked task Run production build verification',
        });
        toolItems.push({
          id: `it-${Date.now() + 3}`,
          type: 'task',
          text: 'Production build verification finished',
        });
      } else {
        setAuxiliaryTab('diff');
        toolItems.push({
          id: `it-${Date.now() + 2}`,
          type: 'edit',
          text: 'Edited',
          filename: 'tokens.css',
          additions: 12,
          deletions: 4,
        });
      }

      const thoughtItem: StreamItem = {
        id: `it-${Date.now() + 4}`,
        type: 'thought',
        text: 'Thought for 3s',
        durationSeconds: 3,
        details: `Instruction parsed: "${text}".
1. Evaluated required tools and security constraints.
2. Verified local environment and executed action pipeline.
3. Updated auxiliary inspector state.`,
      };

      const assistantItem: StreamItem = {
        id: `it-${Date.now() + 5}`,
        type: 'text',
        text: `I've analyzed your instruction and executed the requested operation. Check the Auxiliary Pane on the right for live inspection output.`,
      };

      const taskFinishItem: StreamItem = {
        id: `it-${Date.now() + 6}`,
        type: 'task',
        text: 'Task finished',
      };

      setSessionStreams((prev) => ({
        ...prev,
        [activeSessionId]: [
          ...(prev[activeSessionId] || []).filter((i) => i.type !== 'working'),
          thoughtItem,
          ...toolItems,
          assistantItem,
          taskFinishItem,
        ],
      }));
    }, 1200);
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

  // Drag Resizer for Auxiliary Pane
  const handleMouseDownResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = auxiliaryWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 320), 860);
      setAuxiliaryWidth(newWidth);
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#131314] text-[#c4c7c5] select-none font-sans">
      
      {/* WINDOW TOP BAR - Authentic Google Antigravity Spec */}
      <AntigravityTopBar
        projectTitle={activeConversation.project}
        conversationTitle={activeConversation.title}
        onOpenIde={() => {
          setAuxiliaryTab('diff');
          setAuxiliaryOpen(true);
        }}
        onToggleAuxiliary={() => setAuxiliaryOpen(!auxiliaryOpen)}
        auxiliaryOpen={auxiliaryOpen}
        onNavigateHome={onNavigateHome}
      />

      {/* MAIN BODY AREA: Sidebar + Stream Canvas + Auxiliary Pane */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* LEFT SIDEBAR - 1:1 Antigravity Desktop Left Nav */}
        <AntigravitySidebar
          conversations={conversations}
          activeId={activeSessionId}
          onSelect={(id) => setActiveSessionId(id)}
          onNewConversation={handleNewSession}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAutomations={() => setAutomationsOpen(true)}
          onOpenCustomizations={() => setCustomizationsOpen(true)}
        />

        {/* CENTER REASONING STREAM & FLOATING INPUT TRAY */}
        <main className="flex-1 flex flex-col min-w-0 h-full relative bg-[#131314]">
          <MessageStream
            sessionTitle={activeConversation.title}
            items={currentStreamItems}
            onSendMessage={handleSendMessage}
            onOpenIde={() => {
              setAuxiliaryTab('diff');
              setAuxiliaryOpen(true);
            }}
            onOpenBrowser={() => {
              setAuxiliaryTab('browser');
              setAuxiliaryOpen(true);
            }}
          />

          {/* Collapsed Auxiliary Pane Toggle Button */}
          {!auxiliaryOpen && (
            <button
              type="button"
              onClick={() => setAuxiliaryOpen(true)}
              className="absolute right-3 top-3 z-30 p-1.5 rounded-lg bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] text-[#8e918f] hover:text-[#e3e3e3] transition-colors cursor-pointer shadow-lg"
              title="Expand Auxiliary Inspector (Ctrl+Shift+B)"
            >
              <svg viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
                <path d="M120-120v-720h720v720H120Zm80-80h560v-560H200v560Zm400-80v-400h80v400h-80Z"/>
              </svg>
            </button>
          )}
        </main>

        {/* RIGHT AUXILIARY PANE (Overview, Subagents, Browser, Diff, Terminal, Artifacts) */}
        {auxiliaryOpen && (
          <AntigravityAuxiliaryPane
            width={auxiliaryWidth}
            onResizeMouseDown={handleMouseDownResize}
            onClose={() => setAuxiliaryOpen(false)}
            activeTab={auxiliaryTab}
            onTabChange={setAuxiliaryTab}
          />
        )}

      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Automations Modal */}
      {automationsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#1e1f20] border border-[#444746] rounded-2xl shadow-2xl p-6 text-xs text-[#c4c7c5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#282a2c]">
              <div className="flex items-center gap-2">
                <svg viewBox="0 -960 960 960" className="w-5 h-5 text-[#a8c7fa]" fill="currentColor">
                  <path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                </svg>
                <h2 className="text-sm font-semibold text-[#e3e3e3]">Scheduled Automations & Cron Tasks</h2>
              </div>
              <button
                type="button"
                onClick={() => setAutomationsOpen(false)}
                className="text-[#8e918f] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="py-4">
              <CronScheduler
                jobs={cronJobs}
                onToggleJob={handleToggleCronJob}
                onTriggerJob={handleTriggerCronJob}
                onAddJob={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* Customizations / MCP Skills Modal */}
      {customizationsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#1e1f20] border border-[#444746] rounded-2xl shadow-2xl p-6 text-xs text-[#c4c7c5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#282a2c]">
              <div className="flex items-center gap-2">
                <svg viewBox="0 -960 960 960" className="w-5 h-5 text-[#a8c7fa]" fill="currentColor">
                  <path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                </svg>
                <h2 className="text-sm font-semibold text-[#e3e3e3]">Customizations, MCP Servers & Skills</h2>
              </div>
              <button
                type="button"
                onClick={() => setCustomizationsOpen(false)}
                className="text-[#8e918f] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="py-4">
              <McpSkillsManager
                skills={mcpSkills}
                onToggleSkill={handleToggleMcpSkill}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
