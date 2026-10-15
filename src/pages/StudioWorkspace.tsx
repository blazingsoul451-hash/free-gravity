import React, { useState, useEffect } from 'react';
import { AntigravityTopBar } from '../components/studio/AntigravityTopBar';
import { AntigravitySidebar, SidebarConversation } from '../components/studio/AntigravitySidebar';
import { AntigravityAuxiliaryPane, AuxiliaryTab } from '../components/studio/AntigravityAuxiliaryPane';
import { MessageStream } from '../components/stream/MessageStream';
import { SettingsModal } from '../components/rail/SettingsModal';
import { CronScheduler } from '../components/rail/CronScheduler';
import { McpSkillsManager } from '../components/rail/McpSkillsManager';
import { 
  INITIAL_SETTINGS, 
  INITIAL_CRON_JOBS, 
  INITIAL_MCP_SKILLS 
} from '../lib/mock-data';
import { Settings, CronJob, McpSkill, ToolCall } from '../types';
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
    isLoading: true,
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

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({ onNavigateHome }) => {
  // Navigation & Dialog states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [customizationsOpen, setCustomizationsOpen] = useState(false);

  // Conversations & Projects state
  const [conversations, setConversations] = useState<SidebarConversation[]>(INITIAL_CONVERSATIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('conv-1');

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
    setActiveSessionId(newId);
  };

  const handleSendMessage = (text: string) => {
    if (wsClient.isConnected()) {
      wsClient.sendAgentMessage(text, { model: settings.model });
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
            onSendMessage={handleSendMessage}
            onOpenIde={() => {
              setAuxiliaryTab('diff');
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

        {/* RIGHT AUXILIARY PANE (Review, Files, Browser, Terminal, Artifacts) */}
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
