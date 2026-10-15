import React from 'react';
import { 
  MessageSquare, 
  Clock, 
  Cpu, 
  Settings as SettingsIcon, 
  FolderGit2, 
  Compass, 
  Sparkles,
  Zap
} from 'lucide-react';

interface ActivityBarProps {
  activeTab: 'chat' | 'scheduler' | 'mcp';
  setActiveTab: (tab: 'chat' | 'scheduler' | 'mcp') => void;
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
    <aside className="w-14 flex-shrink-0 flex flex-col items-center py-3 bg-[#0d0e14] border-r border-[#e6eaf00f] z-20 select-none justify-between">
      {/* Top Group: Brand Logo & Navigation */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Free Gravity Logo */}
        <button
          onClick={onNavigateHome}
          title="Return to Free Gravity Showcase"
          className="relative group p-2.5 rounded-xl hover:bg-white/[0.06] transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-[0_0_15px_rgba(124,58,237,0.4)] group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all">
            <div className="w-full h-full bg-[#090a0f] rounded-[7px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <span className="absolute left-16 px-2 py-1 bg-[#18191d] border border-white/10 text-xs text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Free Gravity Showcase
          </span>
        </button>

        <div className="w-7 h-[1px] bg-white/[0.08]" />

        {/* Tab 1: Chat Sessions */}
        <button
          onClick={() => setActiveTab('chat')}
          className={`relative group p-2.5 rounded-xl transition-all ${
            activeTab === 'chat'
              ? 'bg-violet-600/20 text-violet-400 shadow-[0_0_12px_rgba(124,58,237,0.3)]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Chat Sessions"
        >
          <MessageSquare className="w-5 h-5" />
          {activeTab === 'chat' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-violet-400 rounded-r-full" />
          )}
          <span className="absolute left-16 px-2 py-1 bg-[#18191d] border border-white/10 text-xs text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Agent Chat
          </span>
        </button>

        {/* Tab 2: Background Cron Schedulers */}
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`relative group p-2.5 rounded-xl transition-all ${
            activeTab === 'scheduler'
              ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Cron Schedulers & Automations"
        >
          <Clock className="w-5 h-5" />
          {cronCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
          )}
          {activeTab === 'scheduler' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan-400 rounded-r-full" />
          )}
          <span className="absolute left-16 px-2 py-1 bg-[#18191d] border border-white/10 text-xs text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Cron Automations ({cronCount} active)
          </span>
        </button>

        {/* Tab 3: MCP & REA Skills */}
        <button
          onClick={() => setActiveTab('mcp')}
          className={`relative group p-2.5 rounded-xl transition-all ${
            activeTab === 'mcp'
              ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.05]'
          }`}
          title="MCP Servers & REA Skillpack"
        >
          <Cpu className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 px-1 bg-emerald-500/20 text-[10px] text-emerald-300 font-mono rounded-full border border-emerald-500/30">
            {mcpCount}
          </span>
          {activeTab === 'mcp' && (
            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-emerald-400 rounded-r-full" />
          )}
          <span className="absolute left-16 px-2 py-1 bg-[#18191d] border border-white/10 text-xs text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            MCP & morluto/rea Skills
          </span>
        </button>
      </div>

      {/* Bottom Group: Status Indicator & Settings */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* OmniRoute Status Dot */}
        <div 
          className="group relative flex items-center justify-center p-2 rounded-lg hover:bg-white/[0.05] cursor-pointer"
          onClick={openSettings}
          title="OmniRoute AI Gateway: Active"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="absolute left-16 px-2 py-1 bg-[#18191d] border border-white/10 text-xs text-emerald-300 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            OmniRoute: Hermes 3 (Connected)
          </span>
        </div>

        {/* Settings Button */}
        <button
          onClick={openSettings}
          className="relative group p-2.5 text-[#94a3b8] hover:text-white hover:bg-white/[0.05] rounded-xl transition-all"
          title="Studio & Model Settings"
        >
          <SettingsIcon className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          <span className="absolute left-16 px-2 py-1 bg-[#18191d] border border-white/10 text-xs text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
            Settings & API Keys
          </span>
        </button>
      </div>
    </aside>
  );
};
