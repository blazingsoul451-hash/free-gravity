import React, { useState } from 'react';
import { IconFolder } from '../icons/AntigravityIcons';

interface ProjectSwitcherProps {
  currentProject: string;
  onSelectProject?: (project: string) => void;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({ currentProject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const projects = [
    { name: 'free-gravity', path: 'c:/Users/ice/Documents/antigravity/agitated-darwin', branch: 'main' },
    { name: 'playwright-e2e-suite', path: '~/projects/playwright-e2e', branch: 'feature/screencast' },
    { name: 'hermes-rea-agent', path: '~/agents/morluto-rea', branch: 'main' },
  ];

  return (
    <div className="relative p-2.5 border-b border-white/[0.04] select-none font-sans tracking-tight">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-colors text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded bg-white/[0.04] text-zinc-400 flex items-center justify-center flex-shrink-0 border border-white/[0.04]">
            <IconFolder className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors flex items-center gap-1.5">
              <span>{currentProject}</span>
              <span className="text-[10px] px-1 py-0.2 bg-white/[0.04] text-zinc-400 rounded font-mono border border-white/[0.04]">
                main
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>OWASP ASI05 Jailed</span>
            </div>
          </div>
        </div>
        <svg
          viewBox="0 -960 960 960"
          className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
        >
          <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-12 left-2.5 right-2.5 z-40 bg-[#14151d] border border-white/[0.06] rounded-xl shadow-xl p-1 animate-in fade-in duration-150">
            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-2 py-1">
              Active Workspaces
            </div>
            {projects.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  p.name === currentProject
                    ? 'bg-white/[0.06] text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <IconFolder className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{p.name}</span>
                </div>
                {p.name === currentProject && (
                  <span className="text-zinc-400 text-xs">&bull;</span>
                )}
              </button>
            ))}
            <div className="h-[1px] bg-white/[0.04] my-1" />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors cursor-pointer"
            >
              <span>+</span>
              <span>Open Local Workspace...</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
