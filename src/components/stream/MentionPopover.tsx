import React from 'react';

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
  },
  {
    mention: '@folder',
    name: 'Attach Directory',
    description: 'Provide directory tree context to the Hermes loop',
  },
  {
    mention: '@terminal',
    name: 'Active Terminal Context',
    description: 'Include recent xterm stdout and exit codes',
  },
  {
    mention: '@web',
    name: 'Live URL Context',
    description: 'Point Playwright to a web URL for inspection',
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
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#14151d] border border-white/[0.06] rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in duration-150 select-none tracking-tight">
      <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-2.5 py-1">
        Context Mentions
      </div>
      <div className="space-y-0.5">
        {filtered.map((item) => (
          <button
            key={item.mention}
            type="button"
            onClick={() => onSelect(item.mention)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left hover:bg-white/[0.04] transition-colors group cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                <span className="text-zinc-300 font-mono">{item.mention}</span>
                <span className="text-zinc-600">&bull;</span>
                <span className="truncate">{item.name}</span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">{item.description}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-xs text-zinc-500">
            No matching mentions found.
          </div>
        )}
      </div>
    </div>
  );
};
