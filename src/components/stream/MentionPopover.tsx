import React from 'react';
import { FileCode, Folder, Terminal, Globe, Code2 } from 'lucide-react';

interface MentionPopoverProps {
  isOpen: boolean;
  onSelect: (mention: string) => void;
  query: string;
}

export const MENTIONS = [
  {
    mention: '@file',
    name: 'Attach File Context',
    description: 'Reference a workspace file (e.g. src/styles/tokens.css)',
    icon: <FileCode className="w-4 h-4 text-violet-400" />,
  },
  {
    mention: '@folder',
    name: 'Attach Directory',
    description: 'Provide directory tree context to the Hermes loop',
    icon: <Folder className="w-4 h-4 text-indigo-400" />,
  },
  {
    mention: '@terminal',
    name: 'Active Terminal Context',
    description: 'Include recent xterm stdout and exit codes',
    icon: <Terminal className="w-4 h-4 text-amber-400" />,
  },
  {
    mention: '@web',
    name: 'Live URL Context',
    description: 'Point Playwright to a web URL for inspection',
    icon: <Globe className="w-4 h-4 text-cyan-400" />,
  },
];

export const MentionPopover: React.FC<MentionPopoverProps> = ({
  isOpen,
  onSelect,
  query,
}) => {
  if (!isOpen) return null;

  const filtered = MENTIONS.filter((m) =>
    m.mention.toLowerCase().includes(query.toLowerCase()) ||
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#18191d] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-2.5 py-1">
        Context Mentions
      </div>
      <div className="space-y-0.5">
        {filtered.map((item) => (
          <button
            key={item.mention}
            onClick={() => onSelect(item.mention)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left hover:bg-white/[0.06] transition-colors group"
          >
            <div className="p-1 rounded bg-white/[0.04] border border-white/[0.06]">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <span className="text-cyan-400 font-mono">{item.mention}</span>
                <span className="text-[#94a3b8]">—</span>
                <span className="truncate">{item.name}</span>
              </div>
              <div className="text-[10px] text-[#64748b] truncate">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
