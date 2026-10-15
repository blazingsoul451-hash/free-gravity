import React, { useState } from 'react';

interface ThinkingPillProps {
  durationSeconds: number;
  content: string;
  completed?: boolean;
}

export const ThinkingPill: React.FC<ThinkingPillProps> = ({
  durationSeconds,
  content,
  completed = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-1.5 select-none tracking-tight">
      {/* Collapsible Pill Button - Seamless, Hairline border */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
          completed
            ? 'bg-[#101116] hover:bg-white/[0.04] border border-white/[0.04] text-zinc-400 hover:text-zinc-200'
            : 'bg-[#101116] border border-white/[0.06] text-zinc-300'
        }`}
      >
        {/* Subtle sparkle indicator */}
        <svg
          viewBox="0 -960 960 960"
          className={`w-3.5 h-3.5 ${completed ? 'text-zinc-400' : 'text-zinc-400 animate-spin'}`}
          fill="currentColor"
        >
          <path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-355Z"/>
        </svg>

        <span className="font-medium">
          {completed ? `Thought for ${durationSeconds.toFixed(1)}s` : 'Thinking...'}
        </span>

        {/* Discreet Model Tag */}
        <span className="text-[10px] font-mono text-zinc-500">
          Hermes 3
        </span>

        {/* Expand/Collapse Chevron */}
        <svg
          viewBox="0 -960 960 960"
          className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 group-hover:text-zinc-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="currentColor"
        >
          <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/>
        </svg>
      </button>

      {/* Expanded Reasoning Tray */}
      {isExpanded && (
        <div className="mt-2 p-3 rounded-lg bg-[#101116] border border-white/[0.04] text-xs font-mono leading-relaxed whitespace-pre-wrap">
          <div className="text-[11px] font-medium text-zinc-400 mb-1.5 flex items-center gap-1.5 pb-1 border-b border-white/[0.04]">
            <svg viewBox="0 -960 960 960" className="w-3 h-3 text-zinc-500" fill="currentColor">
              <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
            <span>Agent Chain-of-Thought Stream</span>
          </div>
          <div className="text-zinc-300 text-xs leading-relaxed font-mono select-text">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};
