import React, { useState } from 'react';
import { Sparkles, ChevronDown, Clock, Brain } from 'lucide-react';

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
    <div className="my-2.5">
      {/* Collapsible Pill Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono transition-all select-none ${
          completed
            ? 'bg-[#18191d] border border-white/10 hover:border-violet-500/40 text-[#94a3b8] hover:text-white'
            : 'bg-violet-950/40 border border-violet-500/40 text-violet-300 thinking-pulse'
        }`}
      >
        <Brain className={`w-3.5 h-3.5 ${completed ? 'text-violet-400' : 'text-cyan-400 animate-spin'}`} />
        <span className="font-sans font-medium">
          {completed ? `Thought for ${durationSeconds}s` : 'Thinking...'}
        </span>
        <span className="text-[10px] text-[#64748b] bg-white/[0.04] px-1.5 py-0.2 rounded-full">
          Hermes 3
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#64748b] transition-transform duration-200 ${
            isExpanded ? 'rotate-180 text-violet-400' : 'group-hover:text-white'
          }`}
        />
      </button>

      {/* Expanded Chain-of-Thought Drawer */}
      {isExpanded && (
        <div className="mt-2 p-3.5 rounded-xl bg-[#141519]/90 border border-violet-500/20 text-xs text-[#cbd5e1] font-mono leading-relaxed whitespace-pre-wrap shadow-lg animate-in fade-in duration-150">
          <div className="text-[10px] uppercase font-semibold text-violet-400/80 tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Hermes 3 Chain-of-Thought Reasoning</span>
          </div>
          {content}
        </div>
      )}
    </div>
  );
};
