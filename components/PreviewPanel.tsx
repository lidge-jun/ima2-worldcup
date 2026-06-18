'use client';

import { KeyRound, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import FrameStrip from './FrameStrip';
import ProgressBar from './ProgressBar';
import type { StyledFrame } from '@/lib/ffmpeg/types';

type PreviewState = 'idle' | 'auth-required' | 'generating' | 'done' | 'error';

export default function PreviewPanel({ state, resultKind, resultB64, gifUrl, videoUrl, frames, progress, grokStage, error, onDownload, onRetry, onAuth }: {
  state: PreviewState;
  resultKind: 'image' | 'gif' | 'video';
  resultB64: string;
  gifUrl: string;
  videoUrl: string;
  frames?: StyledFrame[];
  progress?: { current: number; total: number };
  grokStage?: string;
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
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-2">
        <div className="w-full h-[200px] bg-gray-100 border-3 border-[var(--border)] animate-pulse" />
        {frames && <FrameStrip frames={frames} />}
        {progress && <ProgressBar current={progress.current} total={progress.total} label={`Frame ${progress.current}/${progress.total}`} />}
        {!progress && <div className="text-[11px] font-bold text-gray-400">Applying style...</div>}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle size={48} className="opacity-30 text-[var(--accent)]" />
        <p className="text-[12px] font-bold text-gray-500">{error || 'Generation failed'}</p>
        <button onClick={onRetry} className="neo-btn flex items-center gap-1.5">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (state === 'done') {
    const isGif = resultKind === 'gif' && gifUrl;
    const isVideo = resultKind === 'video' && videoUrl;
    const dlLabel = isVideo ? 'Download MP4' : isGif ? 'Download GIF' : 'Download';
    return (
      <div>
        {isVideo ? (
          <video src={videoUrl} controls autoPlay loop className="w-full border-3 border-[var(--border)]" />
        ) : isGif ? (
          <img src={gifUrl} alt="Styled GIF" className="w-full border-3 border-[var(--border)]" />
        ) : resultB64 ? (
          <img src={`data:image/png;base64,${resultB64}`} alt="Styled result" className="w-full border-3 border-[var(--border)]" />
        ) : null}
        {frames && <FrameStrip frames={frames} />}
        <div className="flex gap-1.5 mt-3">
          <button className="neo-btn flex-1 text-center opacity-40" disabled>Retry</button>
          <button className="neo-btn flex-1 text-center opacity-40" disabled>Share</button>
          <button onClick={onDownload} className="neo-btn neo-btn-accent flex-1 text-center flex items-center justify-center gap-1.5">
            <Download size={14} /> {dlLabel}
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
