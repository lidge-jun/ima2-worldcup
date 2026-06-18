'use client';

import { KeyRound, Loader, AlertTriangle, Download, RefreshCw } from 'lucide-react';

type PreviewState = 'idle' | 'auth-required' | 'generating' | 'done' | 'error';

export default function PreviewPanel({ state, resultB64, error, onDownload, onRetry, onAuth }: {
  state: PreviewState;
  resultB64: string;
  error: string;
  onDownload: () => void;
  onRetry: () => void;
  onAuth: () => void;
}) {
  if (state === 'auth-required') {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-center">
        <KeyRound size={48} className="opacity-20" />
        <p className="text-[13px] font-bold text-gray-400">Sign in with Codex OAuth<br />to start generating</p>
        <button onClick={onAuth} className="neo-btn neo-btn-primary text-[13px] py-2.5 px-6">
          Connect Codex Account
        </button>
      </div>
    );
  }

  if (state === 'generating') {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
        <div className="w-full h-[240px] bg-gray-100 border-3 border-[var(--border)] animate-pulse" />
        <div className="text-[11px] font-bold text-gray-400">Applying style...</div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle size={48} className="opacity-30 text-[var(--accent)]" />
        <p className="text-[12px] font-bold text-gray-500">{error || 'Generation failed'}</p>
        <button onClick={onRetry} className="neo-btn flex items-center gap-1.5">
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (state === 'done' && resultB64) {
    return (
      <div>
        <img
          src={`data:image/png;base64,${resultB64}`}
          alt="Styled result"
          className="w-full border-3 border-[var(--border)]"
        />
        <div className="flex gap-1.5 mt-3">
          <button onClick={onRetry} className="neo-btn flex-1 text-center flex items-center justify-center gap-1.5 opacity-40" disabled>
            <RefreshCw size={14} />
            Retry
          </button>
          <button className="neo-btn flex-1 text-center opacity-40" disabled>Share</button>
          <button onClick={onDownload} className="neo-btn neo-btn-accent flex-1 text-center flex items-center justify-center gap-1.5">
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[300px] flex items-center justify-center text-center">
      <p className="text-[13px] font-bold text-gray-300">Upload an image and hit Generate</p>
    </div>
  );
}
