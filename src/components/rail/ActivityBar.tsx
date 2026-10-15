import React from 'react';
import { 
  AntigravityLogo,
  IconChat, 
  IconFolder, 
  IconSkills, 
  IconSchedule, 
  IconSettings 
} from '../icons/AntigravityIcons';

interface ActivityBarProps {
  activeTab: 'chat' | 'scheduler' | 'mcp' | 'files';
  setActiveTab: (tab: 'chat' | 'scheduler' | 'mcp' | 'files') => void;
  openSettings: () => void;
  onNavigateHome: () => void;
  cronCount: number;
  mcpCount: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  onNavigateHome,
  cronCount,
  mcpCount,
}) => {
  return (
    <aside className="w-12 flex-shrink-0 flex flex-col items-center py-2.5 bg-[#090a0f] border-r border-white/[0.04] z-20 select-none justify-between tracking-tight">
      {/* Top Group: Brand Logo & Navigation */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Antigravity Brand Home Button */}
        <button
          onClick={onNavigateHome}
          title="Return to Free Gravity Showcase"
          className="relative group p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-7 h-7 flex items-center justify-center text-zinc-300">
            <AntigravityLogo className="w-5 h-5" />
          </div>
          <span className="absolute left-14 px-2 py-1 bg-[#14151d] border border-white/[0.06] text-xs text-zinc-300 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Free Gravity Showcase
          </span>
        </button>

        <div className="w-5 h-[1px] bg-white/[0.04]" />

        {/* Tab 1: Chat Sessions */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`relative group w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
            activeTab === 'chat'
              ? 'bg-white/[0.05] text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
          }`}
          title="Agent Chat Stream"
        >
          <IconChat className="w-4 h-4" />
          {activeTab === 'chat' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-zinc-300 rounded-r-full" />
          )}
          <span className="absolute left-14 px-2 py-1 bg-[#14151d] border border-white/[0.06] text-xs text-zinc-300 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Conversations
          </span>
        </button>

        {/* Tab 2: Workspaces & Files */}
        <button
          onClick={() => setActiveTab('files')}
          className={`relative group w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
            activeTab === 'files'
              ? 'bg-white/[0.05] text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
          }`}
          title="Files & Workspace"
        >
          <IconFolder className="w-4 h-4" />
          {activeTab === 'files' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-zinc-300 rounded-r-full" />
          )}
          <span className="absolute left-14 px-2 py-1 bg-[#14151d] border border-white/[0.06] text-xs text-zinc-300 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Workspace Explorer
          </span>
        </button>

        {/* Tab 3: Background Cron Schedulers */}
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`relative group w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
            activeTab === 'scheduler'
              ? 'bg-white/[0.05] text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
          }`}
          title="Cron Automations & Schedules"
        >
          <IconSchedule className="w-4 h-4" />
          {cronCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-400/80 rounded-full" />
          )}
          {activeTab === 'scheduler' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-zinc-300 rounded-r-full" />
          )}
          <span className="absolute left-14 px-2 py-1 bg-[#14151d] border border-white/[0.06] text-xs text-zinc-300 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Automations ({cronCount})
          </span>
        </button>

        {/* Tab 4: MCP & REA Skills */}
        <button
          onClick={() => setActiveTab('mcp')}
          className={`relative group w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
            activeTab === 'mcp'
              ? 'bg-white/[0.05] text-zinc-100'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
          }`}
          title="MCP Tool Servers & REA Skills"
        >
          <IconSkills className="w-4 h-4" />
          {mcpCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-400/80 rounded-full" />
          )}
          {activeTab === 'mcp' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-zinc-300 rounded-r-full" />
          )}
          <span className="absolute left-14 px-2 py-1 bg-[#14151d] border border-white/[0.06] text-xs text-zinc-300 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            MCP Skills ({mcpCount})
          </span>
        </button>
      </div>

      {/* Bottom Group: Settings & Profile */}
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          onClick={openSettings}
          className="relative group w-9 h-9 rounded-md flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition-colors"
          title="Settings & OmniRoute Gateway"
        >
          <IconSettings className="w-4 h-4" />
          <span className="absolute left-14 px-2 py-1 bg-[#14151d] border border-white/[0.06] text-xs text-zinc-300 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Settings
          </span>
        </button>

        {/* User Avatar Chip */}
        <div 
          className="w-7 h-7 rounded-full bg-white/[0.06] text-zinc-300 text-[10px] font-medium flex items-center justify-center cursor-pointer border border-white/[0.06] hover:border-white/[0.12] transition-colors"
          title="Developer"
        >
          DEV
        </div>
      </div>
    </aside>
  );
};
