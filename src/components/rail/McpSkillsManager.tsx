import React from 'react';
import { Cpu, Globe, Folder, Terminal, Brain, SearchCode, Check, Shield } from 'lucide-react';
import { McpSkill } from '../../types';

interface McpSkillsManagerProps {
  skills: McpSkill[];
  onToggleSkill: (id: string) => void;
}

export const McpSkillsManager: React.FC<McpSkillsManagerProps> = ({
  skills,
  onToggleSkill,
}) => {
  const getIcon = (category: McpSkill['category']) => {
    switch (category) {
      case 'browser':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'core':
        return <Folder className="w-4 h-4 text-violet-400" />;
      case 'system':
        return <Terminal className="w-4 h-4 text-amber-400" />;
      case 'rea':
        return <SearchCode className="w-4 h-4 text-rose-400" />;
      default:
        return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#121317]">
      {/* Header */}
      <div className="p-3 border-b border-[#e6eaf00f]">
        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>MCP & Agent Skills</span>
        </div>
        <div className="text-[10px] text-[#64748b]">
          Pre-loaded stdio servers & morluto/rea protocol
        </div>
      </div>

      {/* Skills List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className={`p-3 rounded-xl border transition-all ${
              skill.enabled
                ? 'bg-[#18191d] border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.05)]'
                : 'bg-[#141519] border-[#e6eaf00f] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] mt-0.5">
                  {getIcon(skill.category)}
                </div>
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <span>{skill.name}</span>
                    {skill.category === 'rea' && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-rose-500/20 text-rose-300 font-mono rounded border border-rose-500/30">
                        6-STEP REA
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#94a3b8] mt-1 leading-snug">
                    {skill.description}
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => onToggleSkill(skill.id)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                  skill.enabled ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04] text-[10px] text-[#64748b]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{skill.toolsCount} Tools Active</span>
              </span>
              <span className="font-mono uppercase text-[9px] px-1 bg-white/[0.04] rounded">
                {skill.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
