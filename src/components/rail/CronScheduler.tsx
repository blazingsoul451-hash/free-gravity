import React, { useState } from 'react';
import { IconSchedule } from '../icons/AntigravityIcons';
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#101116] font-sans select-none tracking-tight">
      {/* Header */}
      <div className="p-3 border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
            <IconSchedule className="w-3.5 h-3.5 text-zinc-400" />
            <span>Automations & Cron</span>
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            Recurring background agents & watchers
          </div>
        </div>
      </div>

      {/* Cron Cards */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`p-2.5 rounded-lg border transition-colors ${
              job.enabled
                ? 'bg-[#14151d] border-white/[0.04]'
                : 'bg-[#14151d]/40 border-white/[0.02] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-medium text-zinc-200 truncate">
                  {job.name}
                </div>
                <div className="inline-block px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.04] text-[10px] font-mono text-zinc-400">
                  {job.schedule}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTrigger(job.id)}
                  disabled={!job.enabled || triggeringId === job.id}
                  title="Trigger Immediately"
                  className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                    triggeringId === job.id
                      ? 'bg-white/[0.08] text-zinc-200 animate-spin'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.04]'
                  }`}
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={() => onToggleJob(job.id)}
                  title={job.enabled ? 'Pause schedule' : 'Enable schedule'}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer border ${
                    job.enabled
                      ? 'bg-emerald-950/20 text-emerald-300 border-emerald-900/30'
                      : 'bg-white/[0.03] text-zinc-500 border-white/[0.04]'
                  }`}
                >
                  {job.enabled ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
              "{job.prompt}"
            </p>

            <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-white/[0.04] text-[10px] text-zinc-500 font-mono">
              <span>Next: {job.nextRun}</span>
              {job.lastRun && <span>Last: {job.lastRun}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
