import React, { useState } from 'react';
import { BrowserViewport } from '../inspector/BrowserViewport';
import { MonacoDiffEditor } from '../inspector/MonacoDiffEditor';
import { XtermConsole } from '../inspector/XtermConsole';
import { ArtifactsRenderer } from '../inspector/ArtifactsRenderer';

export type AuxiliaryTab = 'overview' | 'subagents' | 'browser' | 'diff' | 'terminal' | 'artifacts';

interface AntigravityAuxiliaryPaneProps {
  width: number;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  onClose: () => void;
  activeTab?: AuxiliaryTab;
  onTabChange?: (tab: AuxiliaryTab) => void;
}

export const AntigravityAuxiliaryPane: React.FC<AntigravityAuxiliaryPaneProps> = ({
  width,
  onResizeMouseDown,
  onClose,
  activeTab: controlledTab,
  onTabChange,
}) => {
  const [internalTab, setInternalTab] = useState<AuxiliaryTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const currentTab = controlledTab ?? internalTab;
  const setTab = (tab: AuxiliaryTab) => {
    if (onTabChange) onTabChange(tab);
    setInternalTab(tab);
  };

  const subagents = [
    {
      id: 'sub-8f92',
      name: 'Security Auditor',
      role: 'OWASP ASI02 Interceptor & Sandbox Guard',
      status: 'Running',
      progress: 92,
      color: 'bg-emerald-400',
    },
    {
      id: 'sub-3a1b',
      name: 'UI Renderer & Styler',
      role: 'Pixel-perfect CSS & Google Sans Flex synthesis',
      status: 'Active',
      progress: 85,
      color: 'bg-purple-400',
    },
    {
      id: 'sub-5c4d',
      name: 'Playwright CDP Runner',
      role: 'Automated headless browser inspector',
      status: 'Idle',
      progress: 100,
      color: 'bg-blue-400',
    },
  ];

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative flex flex-col h-full bg-[#131314] border-l border-[#282a2c] flex-shrink-0 z-20 text-xs text-[#c4c7c5] font-sans select-none"
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={onResizeMouseDown}
        className="absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-[#a8c7fa]/20 transition-colors z-30"
      />

      {/* Auxiliary Top Bar */}
      <div className="h-10 border-b border-[#282a2c] px-3 flex items-center justify-between bg-[#131314]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTab('overview')}
            className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-[#1e1f20] text-[#e3e3e3] font-medium border border-[#444746]/40'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]/50'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab('subagents')}
            className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              currentTab === 'subagents'
                ? 'bg-[#1e1f20] text-[#e3e3e3] font-medium border border-[#444746]/40'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]/50'
            }`}
          >
            Subagents
          </button>
          <button
            type="button"
            onClick={() => setTab('browser')}
            className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              currentTab === 'browser'
                ? 'bg-[#1e1f20] text-[#e3e3e3] font-medium border border-[#444746]/40'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]/50'
            }`}
          >
            Browser
          </button>
          <button
            type="button"
            onClick={() => setTab('diff')}
            className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              currentTab === 'diff'
                ? 'bg-[#1e1f20] text-[#e3e3e3] font-medium border border-[#444746]/40'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]/50'
            }`}
          >
            Review / Diff
          </button>
          <button
            type="button"
            onClick={() => setTab('terminal')}
            className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              currentTab === 'terminal'
                ? 'bg-[#1e1f20] text-[#e3e3e3] font-medium border border-[#444746]/40'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]/50'
            }`}
          >
            Terminal
          </button>
          <button
            type="button"
            onClick={() => setTab('artifacts')}
            className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
              currentTab === 'artifacts'
                ? 'bg-[#1e1f20] text-[#e3e3e3] font-medium border border-[#444746]/40'
                : 'text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#1e1f20]/50'
            }`}
          >
            Artifacts
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 text-[#8e918f]">
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:text-[#e3e3e3] hover:bg-[#1e1f20] rounded cursor-pointer"
            title="Toggle Auxiliary Pane (Ctrl+Shift+B)"
          >
            <svg viewBox="0 -960 960 960" className="w-4 h-4" fill="currentColor">
              <path d="M120-120v-720h720v720H120Zm80-80h560v-560H200v560Zm400-80v-400h80v400h-80Z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search Header - Exact Google Antigravity Pill Bar */}
      <div className="p-3 border-b border-[#282a2c]/50">
        <div className="relative flex items-center w-full rounded-xl bg-[#1e1f20] border border-[#282a2c] focus-within:border-[#444746] px-3 py-2 transition-all">
          <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f] flex-shrink-0 mr-2.5" fill="currentColor">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tabs, files, plugins, subagents, artifacts, tasks..."
            className="w-full bg-transparent text-xs text-[#e3e3e3] placeholder-[#8e918f] outline-none font-sans"
          />
        </div>
      </div>

      {/* Active Pane View */}
      <div className="flex-1 overflow-hidden relative">
        {currentTab === 'overview' && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setTab('diff')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer group"
              >
                <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f] group-hover:text-[#a8c7fa]" fill="currentColor">
                  <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T740-80H240Zm280-520v-200H240v640h500v-440H520ZM240-800v200-200 640-640Z"/>
                </svg>
                <span className="text-xs font-medium">Review Code Changes</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('diff')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer group"
              >
                <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f] group-hover:text-[#a8c7fa]" fill="currentColor">
                  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H457l-80-80H160v480Zm0 0v-480 480Z"/>
                </svg>
                <span className="text-xs font-medium">Open File in IDE</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('terminal')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer group"
              >
                <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f] group-hover:text-[#a8c7fa]" fill="currentColor">
                  <path d="m384-336 56 56 240-240-240-240-56 56 184 184-184 184ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/>
                </svg>
                <span className="text-xs font-medium">Open Terminal Sandbox</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('browser')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer group"
              >
                <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f] group-hover:text-[#a8c7fa]" fill="currentColor">
                  <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                </svg>
                <span className="text-xs font-medium">Playwright CDP Live Browser</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('subagents')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer group"
              >
                <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f] group-hover:text-[#a8c7fa]" fill="currentColor">
                  <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q64 0 128 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
                </svg>
                <span className="text-xs font-medium">Background Subagents</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('artifacts')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#1e1f20] transition-colors cursor-pointer group"
              >
                <svg viewBox="0 -960 960 960" className="w-4 h-4 text-[#8e918f] group-hover:text-[#a8c7fa]" fill="currentColor">
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480v-80H240v80Zm0-160h480v-80H240v80Zm0-160h480v-80H240v80ZM200-200v-560 560Z"/>
                </svg>
                <span className="text-xs font-medium">Project Artifacts & Architecture</span>
              </button>
            </div>
          </div>
        )}

        {currentTab === 'subagents' && (
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            <div className="flex items-center justify-between text-xs text-[#8e918f] mb-1">
              <span className="font-medium text-[#e3e3e3]">Active Subagents ({subagents.length})</span>
              <span className="text-[10px] text-emerald-400 font-mono">Parallel Mesh</span>
            </div>
            {subagents.map((sub) => (
              <div key={sub.id} className="p-3 rounded-xl bg-[#1e1f20] border border-[#282a2c] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${sub.color} ${sub.status === 'Running' ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-semibold text-[#e3e3e3]">{sub.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8e918f]">{sub.id}</span>
                </div>
                <p className="text-[11px] text-[#8e918f] leading-normal">{sub.role}</p>
                <div className="w-full bg-[#131314] h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${sub.color}`} style={{ width: `${sub.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {currentTab === 'browser' && <BrowserViewport initialUrl="http://localhost:5173" />}
        {currentTab === 'diff' && <MonacoDiffEditor />}
        {currentTab === 'terminal' && <XtermConsole />}
        {currentTab === 'artifacts' && <ArtifactsRenderer />}
      </div>
    </aside>
  );
};
