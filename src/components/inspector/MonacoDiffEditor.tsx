import React, { useState } from 'react';
import { IconDiff } from '../icons/AntigravityIcons';

export const MonacoDiffEditor: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'tokens' | 'hermes' | 'playwright'>('tokens');
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [copied, setCopied] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const files = [
    { id: 'tokens', name: 'tokens.css', path: 'src/styles/tokens.css', status: 'M' },
    { id: 'hermes', name: 'hermes-loop.ts', path: 'server/agent/hermes-loop.ts', status: 'M' },
    { id: 'playwright', name: 'playwright-cdp.ts', path: 'server/browser/playwright-cdp.ts', status: 'A' },
  ];

  const diffData = {
    tokens: [
      { oldNum: 1, newNum: 1, type: 'ctx', text: '@import "tailwindcss";' },
      { oldNum: 2, newNum: 2, type: 'ctx', text: '@import "./antigravity-tokens.css";' },
      { oldNum: 3, newNum: 3, type: 'ctx', text: ':root {' },
      { oldNum: 4, newNum: null, type: 'del', text: '-  --surface-base: #090a0f;' },
      { oldNum: null, newNum: 4, type: 'add', text: '+  --surface-base: #131314;' },
      { oldNum: 5, newNum: null, type: 'del', text: '-  --surface-border: rgba(230, 234, 240, 0.06);' },
      { oldNum: null, newNum: 5, type: 'add', text: '+  --surface-border: #444746;' },
      { oldNum: 6, newNum: 6, type: 'ctx', text: '  --accent-primary: #a8c7fa;' },
      { oldNum: 7, newNum: 7, type: 'ctx', text: '  --radius-pill: 9999px;' },
      { oldNum: 8, newNum: 8, type: 'ctx', text: '}' },
    ],
    hermes: [
      { oldNum: 1, newNum: 1, type: 'ctx', text: 'export class HermesAgentLoop {' },
      { oldNum: 2, newNum: null, type: 'del', text: '-  async execute() { /* stub */ }' },
      { oldNum: null, newNum: 2, type: 'add', text: '+  async execute() { return this.run(); }' },
      { oldNum: 3, newNum: 3, type: 'ctx', text: '}' },
    ],
    playwright: [
      { oldNum: null, newNum: 1, type: 'add', text: '+ export const CDP_PORT = 9222;' },
      { oldNum: null, newNum: 2, type: 'add', text: '+ export async function startScreencast() {}' },
    ],
  };

  const currentDiff = diffData[activeFile] || diffData.tokens;

  const handleCopy = () => {
    const text = currentDiff.map((d) => d.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAccept = () => {
    setAccepted(true);
    setTimeout(() => setAccepted(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090a0f] overflow-hidden select-none font-sans tracking-tight">
      
      {/* Tab Bar Layout */}
      <div className="h-10 bg-[#14151d] border-b border-white/[0.04] flex items-center justify-between px-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => setActiveFile(file.id as any)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-t-md text-xs font-mono transition-colors border-b-2 cursor-pointer ${
                activeFile === file.id
                  ? 'bg-[#090a0f] text-zinc-200 border-zinc-400 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] border-transparent'
              }`}
            >
              <IconDiff className="w-3.5 h-3.5 text-zinc-400" />
              <span>{file.name}</span>
              <span
                className={`text-[10px] px-1 rounded ${
                  file.status === 'M'
                    ? 'bg-amber-950/20 text-amber-300'
                    : 'bg-emerald-950/20 text-emerald-300'
                }`}
              >
                {file.status}
              </span>
            </button>
          ))}
        </div>

        {/* View mode & Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'split' ? 'unified' : 'split')}
            className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-300 border border-white/[0.04] transition-colors cursor-pointer"
          >
            {viewMode === 'split' ? 'Unified' : 'Split'}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-300 border border-white/[0.04] transition-colors cursor-pointer"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-2.5 py-0.5 rounded bg-emerald-950/20 hover:bg-emerald-950/40 text-xs font-medium text-emerald-300 border border-emerald-800/20 transition-colors cursor-pointer"
          >
            {accepted ? 'Accepted' : 'Accept All'}
          </button>
        </div>
      </div>

      {/* Main Diff Layout: Left File Tree + Right Split Diff */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left File Tree Panel */}
        <div className="w-40 bg-[#101116] border-r border-white/[0.04] flex flex-col p-2 select-none">
          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5 px-1">
            Changed ({files.length})
          </div>
          <div className="space-y-0.5">
            {files.map((f) => (
              <div
                key={f.id}
                onClick={() => setActiveFile(f.id as any)}
                className={`p-1.5 rounded-md flex items-center justify-between text-xs font-mono cursor-pointer transition-colors ${
                  activeFile === f.id
                    ? 'bg-white/[0.05] text-zinc-200'
                    : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{f.name}</span>
                <span className="text-[10px] text-zinc-500">{f.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diff Gutters */}
        <div className="flex-1 flex flex-col bg-[#090a0f] overflow-auto font-mono text-xs leading-relaxed">
          <div className="p-2 border-b border-white/[0.04] bg-[#101116] flex items-center justify-between text-[11px] text-zinc-500">
            <span>Original (HEAD) &rarr; Workspace</span>
            <span>Diff View</span>
          </div>

          <div className="flex-1 p-2 space-y-0.5">
            {currentDiff.map((line, idx) => {
              const isAdd = line.type === 'add';
              const isDel = line.type === 'del';

              return (
                <div
                  key={idx}
                  className={`flex items-center text-[11px] font-mono leading-relaxed ${
                    isAdd
                      ? 'bg-emerald-950/20 text-emerald-300'
                      : isDel
                      ? 'bg-red-950/20 text-red-300'
                      : 'text-zinc-400'
                  }`}
                >
                  {/* Left Gutter: Old Line Number */}
                  <span className="w-9 text-right pr-2 select-none text-zinc-600 border-r border-white/[0.04]">
                    {line.oldNum || ''}
                  </span>

                  {/* Right Gutter: New Line Number */}
                  <span className="w-9 text-right pr-2 select-none text-zinc-600 border-r border-white/[0.04]">
                    {line.newNum || ''}
                  </span>

                  {/* Line Marker */}
                  <span className="w-5 text-center font-bold select-none">
                    {isAdd ? '+' : isDel ? '-' : ' '}
                  </span>

                  {/* Line Text */}
                  <span className="flex-1 px-1 whitespace-pre overflow-x-auto">
                    {line.text.replace(/^[+-]\s*/, '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
