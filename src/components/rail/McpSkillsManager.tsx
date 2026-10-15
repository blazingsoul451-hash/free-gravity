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
    <div className="flex-1 flex flex-col min-h-0 bg-[#1e1f20] font-sans select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#444746]">
        <div className="text-xs font-medium text-[#e3e3e3] flex items-center gap-1.5">
          <IconSkills className="w-3.5 h-3.5 text-[#a8c7fa]" />
          <span>MCP Tools & REA Skills</span>
        </div>
        <div className="text-[10px] text-[#8e918f] mt-0.5">
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
                ? 'bg-[#282a2c] border-[#444746]'
                : 'bg-[#282a2c]/50 border-[#444746]/40 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-6 h-6 rounded bg-[#1e1f20] text-[#a8c7fa] mt-0.5 flex items-center justify-center flex-shrink-0 border border-[#444746]">
                  <IconSkills className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#e3e3e3] flex items-center gap-1.5 truncate">
                    <span>{skill.name}</span>
                    {skill.category === 'rea' && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-[#004a77] text-[#c2e7ff] font-mono rounded border border-[#004a77]">
                        REA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8e918f] mt-0.5 leading-snug line-clamp-2">
                    {skill.description}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => onToggleSkill(skill.id)}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center flex-shrink-0 cursor-pointer ${
                  skill.enabled ? 'bg-[#0f5223] justify-end border border-[#80da88]/40' : 'bg-[#1e1f20] justify-start border border-[#444746]'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full shadow-sm ${skill.enabled ? 'bg-[#80da88]' : 'bg-[#8e918f]'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#444746]/60 text-[10px] text-[#8e918f] font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${skill.enabled ? 'bg-[#80da88]' : 'bg-[#8e918f]'}`} />
                <span>{skill.toolsCount} Tools Loaded</span>
              </span>
              <span className="uppercase text-[9px] px-1.5 py-0.2 bg-[#1e1f20] border border-[#444746] rounded text-[#8e918f]">
                {skill.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
