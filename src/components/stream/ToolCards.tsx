import React, { useState } from 'react';
import { 
  Terminal, 
  Globe, 
  FileCode, 
  Clock, 
  SearchCode, 
  Check, 
  X, 
  ChevronDown, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
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

  return (
    <div className="space-y-3 my-3">
      {toolCalls.map((tc) => {
        const isExpanded = expandedCards[tc.id];

        // 1. Browser Action Card
        if (tc.name === 'browser_action') {
          return (
            <div
              key={tc.id}
              className="rounded-xl border border-cyan-500/20 bg-[#13171e]/90 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.08)]"
            >
              <div
                onClick={() => toggleExpand(tc.id)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      <span>Browser: {tc.args.action || 'Navigate'}</span>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
                        {tc.args.url || 'localhost'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {tc.summary} ({tc.durationMs}ms)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>CDP Stream</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 pt-0 border-t border-cyan-500/10 space-y-2 mt-1">
                  {tc.output && (
                    <div className="p-2 rounded-lg bg-black/40 text-[11px] font-mono text-[#94a3b8]">
                      {tc.output}
                    </div>
                  )}
                  {tc.screenshotUrl && (
                    <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-black/50">
                      <img
                        src={tc.screenshotUrl}
                        alt="Playwright Screencast Snapshot"
                        className="w-full h-32 object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2">
                        <span className="text-[10px] text-white/80 font-mono">
                          Playwright Snapshot (1280x800)
                        </span>
                        <button
                          onClick={() => onOpenBrowserTab && onOpenBrowserTab(tc.args.url)}
                          className="px-2 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-200 text-[10px] rounded flex items-center gap-1 transition-all backdrop-blur-sm"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>View in Browser Tab</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // 2. Terminal Run Command Card
        if (tc.name === 'run_command') {
          return (
            <div
              key={tc.id}
              className="rounded-xl border border-amber-500/20 bg-[#161715]/90 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.06)]"
            >
              <div
                onClick={() => toggleExpand(tc.id)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Terminal className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      <span>Command:</span>
                      <code className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                        {tc.args.command || 'terminal'}
                      </code>
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      Exit code 0 ({tc.durationMs}ms) • OWASP Sandboxed
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isExpanded && tc.output && (
                <div className="p-3 pt-0 border-t border-amber-500/10">
                  <div className="relative group p-2.5 rounded-lg bg-[#0d0e12] border border-white/[0.06] text-[11px] font-mono text-[#cbd5e1] whitespace-pre-wrap max-h-48 overflow-y-auto">
                    <button
                      onClick={() => copyToClipboard(tc.output || '', tc.id)}
                      className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy output"
                    >
                      {copiedId === tc.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {tc.output}
                  </div>
                </div>
              )}
            </div>
          );
        }

        // 3. Edit File with Git Diff Card
        if (tc.name === 'edit_file') {
          return (
            <div
              key={tc.id}
              className="rounded-xl border border-violet-500/25 bg-[#15141c]/90 overflow-hidden shadow-[0_0_15px_rgba(124,58,237,0.08)]"
            >
              <div
                onClick={() => toggleExpand(tc.id)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-violet-600/20 text-violet-400 flex items-center justify-center">
                    <FileCode className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-2">
                      <span>Edit File:</span>
                      <span className="text-[11px] font-mono text-violet-300">
                        {tc.diff?.file || tc.args.file}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748b] flex items-center gap-2">
                      <span className="text-emerald-400 font-mono">+{tc.diff?.additions || 0}</span>
                      <span className="text-rose-400 font-mono">-{tc.diff?.deletions || 0}</span>
                      <span>• Git Patch Ready</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onAcceptDiff && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcceptDiff(tc.id);
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-medium flex items-center gap-1 transition-all"
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept</span>
                    </button>
                  )}
                  {onRevertDiff && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRevertDiff(tc.id);
                      }}
                      className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-medium flex items-center gap-1 transition-all"
                    >
                      <X className="w-3 h-3" />
                      <span>Revert</span>
                    </button>
                  )}
                  <ChevronDown className={`w-4 h-4 text-[#64748b] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {isExpanded && tc.diff && (
                <div className="p-3 pt-0 border-t border-violet-500/10">
                  <div className="rounded-lg bg-[#090a0f] border border-white/[0.06] overflow-hidden font-mono text-[11px]">
                    {tc.diff.chunks.map((c, i) => (
                      <div
                        key={i}
                        className={`px-3 py-0.5 leading-snug ${
                          c.type === 'added'
                            ? 'diff-added'
                            : c.type === 'removed'
                            ? 'diff-removed'
                            : 'text-[#94a3b8]'
                        }`}
                      >
                        {c.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
