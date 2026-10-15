import React from 'react';
import { IconSkills } from '../icons/AntigravityIcons';
import { McpSkill } from '../../types';

interface McpSkillsManagerProps {
  skills: McpSkill[];
  onToggleSkill: (id: string) => void;
}

export const McpSkillsManager: React.FC<McpSkillsManagerProps> = ({
  skills,
  onToggleSkill,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#101116] font-sans select-none tracking-tight">
      {/* Header */}
      <div className="p-3 border-b border-white/[0.04]">
        <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
          <IconSkills className="w-3.5 h-3.5 text-zinc-400" />
          <span>MCP Tools & REA Skills</span>
        </div>
        <div className="text-[10px] text-zinc-500 mt-0.5">
          Tool servers & reverse engineering modules
        </div>
      </div>

      {/* Skills List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`p-2.5 rounded-lg border transition-colors ${
              skill.enabled
                ? 'bg-[#14151d] border-white/[0.04]'
                : 'bg-[#14151d]/40 border-white/[0.02] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-5 h-5 rounded bg-white/[0.04] text-zinc-400 mt-0.5 flex items-center justify-center flex-shrink-0 border border-white/[0.04]">
                  <IconSkills className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5 truncate">
                    <span>{skill.name}</span>
                    {skill.category === 'rea' && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-white/[0.04] text-zinc-300 font-mono rounded border border-white/[0.04]">
                        REA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                    {skill.description}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => onToggleSkill(skill.id)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center flex-shrink-0 cursor-pointer ${
                  skill.enabled ? 'bg-emerald-950/40 justify-end border border-emerald-800/40' : 'bg-white/[0.04] justify-start border border-white/[0.06]'
                }`}
              >
                <div className={`w-3 h-3 rounded-full shadow-xs ${skill.enabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.04] text-[10px] text-zinc-500 font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${skill.enabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                <span>{skill.toolsCount} Tools Loaded</span>
              </span>
              <span className="uppercase text-[9px] px-1.5 py-0.2 bg-white/[0.04] border border-white/[0.04] rounded text-zinc-500">
                {skill.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
