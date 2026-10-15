import React, { useState } from 'react';
import { Clock, Play, Plus, Power, CheckCircle2, AlertCircle } from 'lucide-react';
import { CronJob } from '../../types';

interface CronSchedulerProps {
  jobs: CronJob[];
  onToggleJob: (id: string) => void;
  onTriggerJob: (id: string) => void;
  onAddJob: (job: Omit<CronJob, 'id' | 'nextRun'>) => void;
}

export const CronScheduler: React.FC<CronSchedulerProps> = ({
  jobs,
  onToggleJob,
  onTriggerJob,
}) => {
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const handleTrigger = (id: string) => {
    setTriggeringId(id);
    onTriggerJob(id);
    setTimeout(() => setTriggeringId(null), 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#121317]">
      {/* Header */}
      <div className="p-3 border-b border-[#e6eaf00f] flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Background Automations</span>
          </div>
          <div className="text-[10px] text-[#64748b]">
            Recurring agent cron tasks & heartbeat monitors
          </div>
        </div>
      </div>

      {/* Cron Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`p-3 rounded-xl border transition-all ${
              job.enabled
                ? 'bg-[#18191d] border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.06)]'
                : 'bg-[#141519] border-[#e6eaf00f] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <span className="truncate">{job.name}</span>
                </div>
                <div className="inline-block px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                  {job.schedule}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleTrigger(job.id)}
                  disabled={!job.enabled || triggeringId === job.id}
                  title="Trigger Immediately"
                  className={`p-1.5 rounded-lg border transition-all ${
                    triggeringId === job.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-spin'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-[#94a3b8] hover:text-white border-white/[0.06]'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
                <button
                  onClick={() => onToggleJob(job.id)}
                  title={job.enabled ? 'Pause schedule' : 'Enable schedule'}
                  className={`p-1.5 rounded-lg border transition-all ${
                    job.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/[0.04] text-[#64748b] border-white/[0.06]'
                  }`}
                >
                  <Power className="w-3 h-3" />
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#94a3b8] mt-2 line-clamp-2">
              "{job.prompt}"
            </p>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04] text-[10px] text-[#64748b]">
              <span>Next: {job.nextRun}</span>
              {job.lastRun && <span>Last: {job.lastRun}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
