import React from 'react';
import { 
  Globe, 
  ListTree, 
  Target, 
  Clock, 
  SearchCode, 
  Zap, 
  BookmarkPlus 
} from 'lucide-react';

export interface SlashCommand {
  command: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface SlashPopoverProps {
  isOpen: boolean;
  onSelect: (command: string) => void;
  query: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/browser',
    name: 'Browser Automation',
    description: 'Launch Playwright to navigate, test, and extract web pages',
    icon: <Globe className="w-4 h-4 text-cyan-400" />,
  },
  {
    command: '/plan',
    name: 'Plan & Architect',
    description: 'Generate step-by-step implementation roadmap before coding',
    icon: <ListTree className="w-4 h-4 text-indigo-400" />,
  },
  {
    command: '/goal',
    name: 'Autonomous Goal Mode',
    description: 'Run extra thorough long-running task without stopping',
    icon: <Target className="w-4 h-4 text-emerald-400" />,
  },
  {
    command: '/schedule',
    name: 'Cron & Timers',
    description: 'Schedule a one-shot reminder or recurring background cron',
    icon: <Clock className="w-4 h-4 text-amber-400" />,
  },
  {
    command: '/rea',
    name: 'morluto/rea Deep Analysis',
    description: '6-phase deep reverse engineering of repos, APIs, or UI',
    icon: <SearchCode className="w-4 h-4 text-rose-400" />,
  },
  {
    command: '/boost',
    name: 'Boost Deep Reasoning',
    description: 'Multi-perspective chain-of-thought verification',
    icon: <Zap className="w-4 h-4 text-violet-400" />,
  },
  {
    command: '/learn',
    name: 'Learn & Remember',
    description: 'Persist project patterns into Hermes Agent long-term memory',
    icon: <BookmarkPlus className="w-4 h-4 text-teal-400" />,
  },
];

export const SlashPopover: React.FC<SlashPopoverProps> = ({
  isOpen,
  onSelect,
  query,
}) => {
  if (!isOpen) return null;

  const filtered = SLASH_COMMANDS.filter((cmd) =>
    cmd.command.toLowerCase().includes(query.toLowerCase()) ||
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#18191d] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-2.5 py-1">
        Slash Commands
      </div>
      <div className="max-h-56 overflow-y-auto space-y-0.5">
        {filtered.map((item) => (
          <button
            key={item.command}
            onClick={() => onSelect(item.command)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.06] transition-colors group"
          >
            <div className="p-1 rounded bg-white/[0.04] border border-white/[0.06]">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <span className="text-violet-400 font-mono">{item.command}</span>
                <span className="text-[#94a3b8]">—</span>
                <span className="truncate">{item.name}</span>
              </div>
              <div className="text-[10px] text-[#64748b] truncate">{item.description}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="p-3 text-center text-xs text-[#64748b]">
            No matching slash commands
          </div>
        )}
      </div>
    </div>
  );
};
