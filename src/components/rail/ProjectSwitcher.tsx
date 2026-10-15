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
    <div className="relative p-2.5 border-b border-[#444746] select-none font-sans">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#282a2c] hover:bg-[#333537] border border-[#444746] transition-colors text-left group cursor-pointer"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded bg-[#1e1f20] text-[#a8c7fa] flex items-center justify-center flex-shrink-0 border border-[#444746]">
            <IconFolder className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-xs font-medium text-[#e3e3e3] group-hover:text-white transition-colors flex items-center gap-1.5">
              <span>{currentProject}</span>
              <span className="text-[10px] px-1 py-0.2 bg-[#1e1f20] text-[#8e918f] rounded font-mono border border-[#444746]">
                main
              </span>
            </div>
            <div className="text-[10px] text-[#8e918f] truncate flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#80da88]" />
              <span>OWASP ASI05 Jailed</span>
            </div>
          </div>
        </div>
        <svg
          viewBox="0 -960 960 960"
          className={`w-3.5 h-3.5 text-[#8e918f] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
        >
          <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"/>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-12 left-2.5 right-2.5 z-40 bg-[#1e1f20] border border-[#444746] rounded-xl shadow-2xl p-1 animate-in fade-in duration-150">
            <div className="text-[10px] font-medium text-[#8e918f] uppercase tracking-wider px-2 py-1">
              Active Workspaces
            </div>
            {projects.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  p.name === currentProject
                    ? 'bg-[#004a77] text-[#c2e7ff] font-medium'
                    : 'text-[#c4c7c5] hover:text-[#e3e3e3] hover:bg-[#282a2c]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <IconFolder className="w-3.5 h-3.5 text-[#a8c7fa]" />
                  <span className="truncate">{p.name}</span>
                </div>
                {p.name === currentProject && (
                  <span className="text-[#c2e7ff]">&bull;</span>
                )}
              </button>
            ))}
            <div className="h-[1px] bg-[#444746] my-1" />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-[#8e918f] hover:text-[#e3e3e3] hover:bg-[#282a2c] transition-colors cursor-pointer"
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
