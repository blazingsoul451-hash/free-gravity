import React from 'react';

export interface SlashCommand {
  command: string;
  name: string;
  description: string;
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
    description: 'Launch Playwright to navigate, audit, and extract web pages',
  },
  {
    command: '/plan',
    name: 'Plan & Architect',
    description: 'Generate step-by-step implementation roadmap before coding',
  },
  {
    command: '/goal',
    name: 'Autonomous Goal Mode',
    description: 'Run extra thorough long-running task without stopping',
  },
  {
    command: '/schedule',
    name: 'Cron & Timers',
    description: 'Schedule a one-shot reminder or recurring background cron',
  },
  {
    command: '/rea',
    name: 'morluto/rea Deep Analysis',
    description: '6-phase deep reverse engineering of repos, APIs, or UI',
  },
  {
    command: '/boost',
    name: 'Boost Deep Reasoning',
    description: 'Multi-perspective chain-of-thought verification',
  },
  {
    command: '/learn',
    name: 'Learn & Remember',
    description: 'Persist project patterns into Hermes Agent long-term memory',
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
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-[#14151d] border border-white/[0.06] rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in duration-150 select-none tracking-tight">
      <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-2.5 py-1">
        Slash Commands
      </div>
      <div className="max-h-56 overflow-y-auto space-y-0.5">
        {filtered.map((item) => (
          <button
            key={item.command}
            type="button"
            onClick={() => onSelect(item.command)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-white/[0.04] transition-colors group cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                <span className="text-zinc-300 font-mono">{item.command}</span>
                <span className="text-zinc-600">&bull;</span>
                <span>{item.name}</span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                {item.description}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-xs text-zinc-500">
            No matching commands found.
          </div>
        )}
      </div>
    </div>
  );
};
