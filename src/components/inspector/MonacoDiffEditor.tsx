import React, { useState } from 'react';
import { FileCode, GitCompare, Copy, Check, Save } from 'lucide-react';

export const MonacoDiffEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'hermes' | 'playwright'>('tokens');
  const [viewMode, setViewMode] = useState<'editor' | 'diff'>('diff');
  const [copied, setCopied] = useState(false);

  const fileContents = {
    tokens: `@import "tailwindcss";

:root {
  /* Surface Tokens (Antigravity Obsidian Spec) */
  --surface-base: #090a0f;
  --surface-subtle: #121317;
  --surface-panel: #18191d;
  --surface-card: #212226;
  --surface-border: rgba(230, 234, 240, 0.06);
  --surface-border-active: rgba(124, 58, 237, 0.85);

  /* Brand Glow Accents */
  --accent-violet: #7c3aed;
  --accent-cyan: #06b6d4;
  --accent-glow: 0 0 24px rgba(6, 182, 212, 0.4);

  /* Glass & Frosted Blur */
  --frosted-glass: blur(16px);
  --pill-contour: 9999px;
}`,
    hermes: `import { EventEmitter } from 'events';

export class HermesAgentLoop extends EventEmitter {
  constructor(private config: { model: string; gateway: string }) {
    super();
  }

  async executeTask(prompt: string) {
    this.emit('thought', 'Planning tool calls with Hermes 3...');
    // ReAct loop with defensive JSON parser
  }
}`,
    playwright: `import { chromium } from 'playwright';

export async function launchCdpBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=9222']
  });
  return browser;
}`,
  };

  const diffLines = [
    { type: 'context', oldLine: 8, newLine: 8, text: '  --surface-border: rgba(230, 234, 240, 0.06);' },
    { type: 'removed', oldLine: 9, newLine: null, text: '-  --surface-border-active: rgba(124, 58, 237, 0.45);' },
    { type: 'removed', oldLine: 10, newLine: null, text: '-  --frosted-glass: blur(12px);' },
    { type: 'added', oldLine: null, newLine: 9, text: '+  --surface-border-active: rgba(124, 58, 237, 0.85);' },
    { type: 'added', oldLine: null, newLine: 10, text: '+  --accent-glow: 0 0 24px rgba(6, 182, 212, 0.4);' },
    { type: 'added', oldLine: null, newLine: 11, text: '+  --frosted-glass: blur(16px);' },
    { type: 'added', oldLine: null, newLine: 12, text: '+  --pill-contour: 9999px;' },
    { type: 'context', oldLine: 11, newLine: 13, text: '  --radius-panel: 12px;' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0e14] overflow-hidden select-none">
      
      {/* File Tabs & Mode Switcher */}
      <div className="h-10 bg-[#121317] border-b border-[#e6eaf00f] flex items-center justify-between px-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'tokens', label: 'tokens.css' },
            { id: 'hermes', label: 'hermes-loop.ts' },
            { id: 'playwright', label: 'playwright-cdp.ts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'bg-[#18191d] text-white border-violet-500 font-medium'
                  : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.03] border-transparent'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-violet-400" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* View Mode & Copy Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center p-0.5 rounded-lg bg-[#18191d] border border-white/[0.06]">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-2 py-0.5 text-[11px] rounded transition-all ${
                viewMode === 'editor' ? 'bg-violet-600 text-white font-medium' : 'text-[#64748b] hover:text-white'
              }`}
            >
              Source
            </button>
            <button
              onClick={() => setViewMode('diff')}
              className={`px-2 py-0.5 text-[11px] rounded transition-all flex items-center gap-1 ${
                viewMode === 'diff' ? 'bg-violet-600 text-white font-medium' : 'text-[#64748b] hover:text-white'
              }`}
            >
              <GitCompare className="w-3 h-3" />
              <span>Diff</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Copy file"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor / Diff Content */}
      <div className="flex-1 overflow-auto bg-[#090a0f] p-4 font-mono text-xs leading-relaxed text-[#cbd5e1]">
        {viewMode === 'editor' ? (
          <div className="space-y-0.5">
            {fileContents[activeTab].split('\n').map((line, idx) => (
              <div key={idx} className="flex gap-4 hover:bg-white/[0.02]">
                <span className="w-8 text-right text-[#475569] select-none text-[11px]">
                  {idx + 1}
                </span>
                <span className="whitespace-pre">{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="text-[11px] text-[#64748b] pb-2 mb-2 border-b border-white/[0.06] flex items-center justify-between">
              <span>Comparing working tree against HEAD</span>
              <span className="text-emerald-400">+4 additions / -2 deletions</span>
            </div>
            {diffLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex gap-3 px-2 py-0.5 rounded-sm ${
                  line.type === 'added'
                    ? 'diff-added'
                    : line.type === 'removed'
                    ? 'diff-removed'
                    : 'text-[#94a3b8]'
                }`}
              >
                <span className="w-6 text-right text-[#475569] select-none text-[10px]">
                  {line.oldLine || ' '}
                </span>
                <span className="w-6 text-right text-[#475569] select-none text-[10px]">
                  {line.newLine || ' '}
                </span>
                <span className="whitespace-pre font-mono">{line.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
