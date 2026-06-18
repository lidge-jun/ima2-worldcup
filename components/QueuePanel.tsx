'use client';

import { X } from 'lucide-react';
import type { Job } from '@/lib/store/queue';

const STATUS_CLASS: Record<string, string> = {
  generating: 'text-[var(--accent)]',
  queued: 'text-gray-500',
  done: 'text-green-600',
  error: 'text-[var(--accent)]',
};

export default function QueuePanel({ jobs, onCancel }: {
  jobs: Job[];
  onCancel: (id: string) => void;
}) {
  const active = jobs.filter(j => j.status === 'generating');
  const pending = jobs.filter(j => j.status === 'queued');
  const completed = jobs.filter(j => j.status === 'done' || j.status === 'error').slice(0, 10);

  return (
    <aside className="border-l-3 border-[var(--border)] bg-[var(--surface)] flex flex-col h-full">
      <div className="neo-panel-head text-[11px]">Queue ({jobs.length})</div>
      <div className="flex-1 overflow-y-auto">
        {jobs.length === 0 ? (
          <div className="text-center text-[11px] font-semibold text-gray-400 py-8">
            Add items to queue
          </div>
        ) : (
          <>
            {active.length > 0 && <Section label="Active" />}
            {active.map(j => <QueueItem key={j.id} job={j} onCancel={onCancel} />)}

            {pending.length > 0 && <Section label="Pending" />}
            {pending.map(j => <QueueItem key={j.id} job={j} onCancel={onCancel} />)}

            {completed.length > 0 && <Section label="Completed" />}
            {completed.map(j => <QueueItem key={j.id} job={j} onCancel={onCancel} dimmed />)}
          </>
        )}
      </div>
    </aside>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="px-2.5 py-1.5 text-[8px] font-extrabold uppercase text-gray-400 bg-[var(--bg)] border-b border-gray-200">
      {label}
    </div>
  );
}

function QueueItem({ job, onCancel, dimmed }: { job: Job; onCancel: (id: string) => void; dimmed?: boolean }) {
  const statusLabel = job.status === 'generating' && job.progress
    ? `Frame ${job.progress.current}/${job.progress.total}`
    : job.status === 'queued' ? `Waiting · ${job.style}`
    : job.status === 'done' ? `Done · ${job.style}`
    : job.error || 'Error';

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-2 border-b border-gray-100 ${dimmed ? 'opacity-50' : ''}`}>
      <div className="w-10 h-7 border-2 border-[var(--border)] bg-[var(--bg)] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-extrabold truncate">{job.fileName}</div>
        <div className={`text-[8px] font-semibold mt-0.5 ${STATUS_CLASS[job.status] || ''}`}>{statusLabel}</div>
        {job.status === 'generating' && job.progress && (
          <div className="w-full h-[3px] bg-gray-200 mt-1 overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${Math.round((job.progress.current / job.progress.total) * 100)}%`,
                background: 'repeating-linear-gradient(45deg, var(--accent), var(--accent) 4px, #111 4px, #111 8px)',
                backgroundSize: '11.3px 100%',
                animation: 'qstripe 0.3s linear infinite',
              }}
            />
          </div>
        )}
      </div>
      {(job.status === 'queued' || job.status === 'generating') && (
        <button onClick={() => onCancel(job.id)} className="text-[var(--accent)] flex-shrink-0">
          <X size={12} />
        </button>
      )}
    </div>
  );
}
