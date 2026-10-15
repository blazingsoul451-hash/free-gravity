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
    <div className="flex-1 flex flex-col min-h-0 bg-[#1e1f20] font-sans select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#444746] flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-[#e3e3e3] flex items-center gap-1.5">
            <IconSchedule className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span>Automations & Cron</span>
          </div>
          <div className="text-[10px] text-[#8e918f] mt-0.5">
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
                ? 'bg-[#282a2c] border-[#444746]'
                : 'bg-[#282a2c]/50 border-[#444746]/40 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="text-xs font-medium text-[#e3e3e3] truncate">
                  {job.name}
                </div>
                <div className="inline-block px-1.5 py-0.5 rounded bg-[#1e1f20] border border-[#444746] text-[10px] font-mono text-[#fcbd00]">
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
                      ? 'bg-[#333537] text-[#a8c7fa] animate-spin'
                      : 'bg-[#1e1f20] hover:bg-[#333537] text-[#c4c7c5] hover:text-white border border-[#444746]'
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
                      ? 'bg-[#0f5223]/30 text-[#80da88] border-[#80da88]/40'
                      : 'bg-[#1e1f20] text-[#8e918f] border-[#444746]'
                  }`}
                >
                  {job.enabled ? 'Active' : 'Paused'}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#c4c7c5] mt-2 line-clamp-2 leading-relaxed">
              "{job.prompt}"
            </p>

            <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-[#444746]/60 text-[10px] text-[#8e918f] font-mono">
              <span>Next: {job.nextRun}</span>
              {job.lastRun && <span>Last: {job.lastRun}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
