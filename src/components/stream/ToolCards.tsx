import React, { useState } from 'react';
import { ToolCall } from '../../types';

interface ToolCardsProps {
  toolCalls: ToolCall[];
  onAcceptDiff?: (id: string) => void;
  onRevertDiff?: (id: string) => void;
  onOpenBrowserTab?: (url: string) => void;
}

export const ToolCards: React.FC<ToolCardsProps> = ({
  toolCalls,
  onAcceptDiff,
  onRevertDiff,
  onOpenBrowserTab,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'tc-1': true,
    'tc-2': true,
    'tc-3': true,
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderDiffContent = (diff: ToolCall['diff']) => {
    if (!diff) return null;
    if (typeof diff === 'string') {
      return diff.split('\n').map((line, lidx) => {
        const isAdd = line.startsWith('+');
        const isRem = line.startsWith('-');
        return (
          <div
            key={lidx}
            className={`px-2 py-0.5 rounded-sm font-mono text-[11px] ${
              isAdd
                ? 'bg-emerald-950/25 text-emerald-300 border-l-2 border-emerald-500/50'
                : isRem
                ? 'bg-red-950/25 text-red-300 border-l-2 border-red-500/50'
                : 'text-zinc-400'
            }`}
          >
            {line}
          </div>
        );
      });
    }

    return diff.chunks.map((chunk, cidx) => {
      const isAdd = chunk.type === 'added';
      const isRem = chunk.type === 'removed';
      return (
        <div
          key={cidx}
          className={`px-2 py-0.5 rounded-sm font-mono text-[11px] ${
            isAdd
              ? 'bg-emerald-950/25 text-emerald-300 border-l-2 border-emerald-500/50'
              : isRem
              ? 'bg-red-950/25 text-red-300 border-l-2 border-red-500/50'
              : 'text-zinc-400'
          }`}
        >
          {chunk.text}
        </div>
      );
    });
  };

  return (
    <div className="space-y-2 my-2 select-none font-sans">
      {toolCalls.map((tc) => {
        const isExpanded = expandedCards[tc.id] !== false; // default open
        const isSuccess = tc.status === 'completed';
        const isRunning = tc.status === 'running';

        // 1. Browser Action Card
        if (tc.name === 'browser_action') {
          return (
            <div
              key={tc.id}
              className="rounded-lg border border-white/[0.04] bg-[#101116] overflow-hidden transition-colors"
            >
              <div
                onClick={() => toggleExpand(tc.id)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 bg-white/[0.04] border border-white/[0.04] shrink-0">
                    <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-82v-78q-33 0-56.5-23.5T360-320v-40L168-552q-3 18-5.5 36t-2.5 36q0 121 79.5 212T440-162Zm276-102q41-45 62.5-102.5T800-480q0-127-83-220.5T508-800v58q0 25-17.5 42.5T448-682h-88v82q0 25-17.5 42.5T300-540h-60v80h160q25 0 42.5 17.5T460-400v60h60q33 0 56.5 23.5T600-260v36q31-10 58-24.5t58-35.5Z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-2 tracking-tight">
                      <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.04]">
                        browser_action
                      </span>
                      <span className="text-zinc-300 truncate">{tc.args?.action || 'navigate'}</span>
                      <span className="text-[11px] font-mono text-zinc-500 truncate">
                        {tc.args?.url || 'http://localhost:5173'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 tracking-tight truncate">
                      {tc.summary} {tc.durationMs && `(${tc.durationMs}ms)`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-zinc-400 font-mono flex items-center gap-1.5 border border-white/[0.04]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-400' : isRunning ? 'bg-amber-400 animate-ping' : 'bg-red-400'}`} />
                    <span>CDP</span>
                  </span>
                  <svg
                    viewBox="0 -960 960 960"
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="currentColor"
                  >
                    <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/>
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-2.5 pt-0 border-t border-white/[0.04] space-y-2 mt-1">
                  {tc.output && (
                    <div className="p-2.5 rounded bg-[#090a0f] text-[11px] font-mono text-zinc-300 border border-white/[0.04] leading-relaxed">
                      {tc.output}
                    </div>
                  )}
                  {tc.args?.url && onOpenBrowserTab && (
                    <button
                      type="button"
                      onClick={() => onOpenBrowserTab(tc.args.url)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <span>Open live viewport in Inspector &rarr;</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        }

        // 2. Command Execution Card (`run_command`)
        if (tc.name === 'run_command') {
          return (
            <div
              key={tc.id}
              className="rounded-lg border border-white/[0.04] bg-[#101116] overflow-hidden transition-colors"
            >
              <div
                onClick={() => toggleExpand(tc.id)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 bg-white/[0.04] border border-white/[0.04] shrink-0">
                    <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                      <path d="m384-336 56 56 240-240-240-240-56 56 184 184-184 184Zm136 176h280v-80H520v80ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-2 tracking-tight">
                      <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.04]">
                        run_command
                      </span>
                      <span className="font-mono text-[11.5px] text-zinc-300 truncate">
                        {tc.args?.command || tc.args?.CommandLine || 'bash'}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 tracking-tight truncate">
                      {tc.summary} {tc.durationMs && `(${tc.durationMs}ms)`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-zinc-400 font-mono flex items-center gap-1.5 border border-white/[0.04]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-400' : isRunning ? 'bg-amber-400 animate-ping' : 'bg-red-400'}`} />
                    <span>{tc.status}</span>
                  </span>
                  <svg
                    viewBox="0 -960 960 960"
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="currentColor"
                  >
                    <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/>
                  </svg>
                </div>
              </div>

              {isExpanded && tc.output && (
                <div className="px-3 pb-2.5 pt-0 border-t border-white/[0.04] mt-1">
                  <div className="relative group rounded bg-[#090a0f] border border-white/[0.04] p-2.5 font-mono text-[11px] text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tc.output || '', tc.id)}
                      className="absolute right-2 top-2 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-400 hover:text-zinc-200 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <span>{copiedId === tc.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                    {tc.output}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // 3. File Edit / Diff Card (`edit_file`)
        return (
          <div
            key={tc.id}
            className="rounded-lg border border-white/[0.04] bg-[#101116] overflow-hidden transition-colors"
          >
            <div
              onClick={() => toggleExpand(tc.id)}
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 bg-white/[0.04] border border-white/[0.04] shrink-0">
                  <svg viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-200 flex items-center gap-2 tracking-tight">
                    <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.04]">
                      {tc.name}
                    </span>
                    <span className="font-mono text-[11.5px] text-zinc-300 truncate">
                      {tc.args?.path || tc.args?.file || 'file.ts'}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5 tracking-tight truncate">
                    {tc.summary} {tc.durationMs && `(${tc.durationMs}ms)`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {tc.diff && (
                  <div className="flex items-center gap-1.5 mr-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onAcceptDiff?.(tc.id)}
                      className="px-2 py-0.5 rounded bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 text-[10px] font-medium border border-emerald-800/30 transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => onRevertDiff?.(tc.id)}
                      className="px-2 py-0.5 rounded bg-red-950/30 hover:bg-red-900/40 text-red-300 text-[10px] font-medium border border-red-800/30 transition-colors cursor-pointer"
                    >
                      Revert
                    </button>
                  </div>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-zinc-400 font-mono flex items-center gap-1.5 border border-white/[0.04]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>diff</span>
                </span>
                <svg
                  viewBox="0 -960 960 960"
                  className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="currentColor"
                >
                  <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/>
                </svg>
              </div>
            </div>

            {isExpanded && tc.diff && (
              <div className="px-3 pb-2.5 pt-0 border-t border-white/[0.04] mt-1">
                <div className="rounded bg-[#090a0f] border border-white/[0.04] p-2 font-mono text-[11px] space-y-0.5 max-h-56 overflow-y-auto leading-relaxed">
                  {renderDiffContent(tc.diff)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
