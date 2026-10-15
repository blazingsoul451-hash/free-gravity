import React, { useState } from 'react';
import { FolderGit2, ChevronDown, Check, Plus, HardDrive, ShieldCheck } from 'lucide-react';

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
    <div className="relative p-3 border-b border-[#e6eaf00f]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#18191d] hover:bg-[#212226] border border-[#e6eaf00f] transition-all text-left group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0">
            <FolderGit2 className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-xs font-medium text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
              <span>{currentProject}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-white/[0.06] text-[#94a3b8] rounded-full font-mono">
                main
              </span>
            </div>
            <div className="text-[10px] text-[#64748b] truncate flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
              <span>OWASP ASI05 Jailed</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#94a3b8] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-14 left-3 right-3 z-40 bg-[#18191d] border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl">
            <div className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider px-2 py-1">
              Active Workspaces
            </div>
            {projects.map((p) => (
              <button
                key={p.name}
                onClick={() => setIsOpen(false)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  p.name === currentProject
                    ? 'bg-violet-600/20 text-violet-300 font-medium'
                    : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <HardDrive className="w-3 h-3 text-[#64748b]" />
                  <span className="truncate">{p.name}</span>
                </div>
                {p.name === currentProject && <Check className="w-3.5 h-3.5 text-violet-400" />}
              </button>
            ))}
            <div className="h-[1px] bg-white/[0.06] my-1" />
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Open Local Workspace...</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
