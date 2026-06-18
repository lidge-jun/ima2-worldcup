'use client';

import { Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import type { V2VProgress } from '@/lib/grok/v2v';

const STAGE_LABELS: Record<V2VProgress, string> = {
  uploading: 'Uploading to Grok...',
  processing: 'Grok is processing...',
  downloading: 'Downloading result...',
  done: 'Complete',
  error: 'Failed',
};

export default function GrokProgress({ stage, message }: {
  stage: V2VProgress;
  message?: string;
}) {
  const isActive = stage !== 'done' && stage !== 'error';

  return (
    <div className="border-3 border-[var(--border)] p-4 bg-[var(--surface)] text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        {stage === 'error' ? (
          <AlertTriangle size={20} className="text-[var(--accent)]" />
        ) : stage === 'done' ? (
          <CheckCircle size={20} />
        ) : (
          <Loader size={20} className="animate-spin" />
        )}
        <span className="text-[13px] font-extrabold uppercase">
          {STAGE_LABELS[stage]}
        </span>
      </div>
      <div className="text-xs font-bold text-[var(--text)] inline-block px-2 py-0.5 bg-[var(--hover)] border-2 border-[var(--border)]">
        GROK V2V
      </div>
      {message && (
        <div className="text-[10px] font-semibold text-gray-500 mt-2">{message}</div>
      )}
      {isActive && (
        <div className="h-2 border-2 border-[var(--border)] bg-gray-100 mt-3 overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] animate-pulse"
            style={{ width: stage === 'uploading' ? '30%' : stage === 'processing' ? '60%' : '90%' }}
          />
        </div>
      )}
    </div>
  );
}
