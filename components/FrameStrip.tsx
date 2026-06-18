'use client';

import type { StyledFrame } from '@/lib/ffmpeg/types';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-200 border-gray-300',
  active: 'bg-[var(--hover)] border-[var(--text)] shadow-[2px_2px_0_var(--shadow)]',
  done: 'bg-[var(--accent)] border-[var(--text)]',
  error: 'bg-red-300 border-red-600',
};

export default function FrameStrip({ frames }: { frames: StyledFrame[] }) {
  if (!frames.length) return null;

  return (
    <div className="flex gap-1 overflow-x-auto py-1 mt-2">
      {frames.map((f, i) => (
        <div
          key={i}
          className={`w-[60px] h-[40px] flex-shrink-0 border-2 relative ${STATUS_COLORS[f.status] || STATUS_COLORS.pending}`}
        >
          {(f.status === 'done' && f.styledB64) ? (
            <img
              src={`data:image/png;base64,${f.styledB64}`}
              alt={`Frame ${i + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={`data:image/png;base64,${f.b64}`}
              alt={`Frame ${i + 1}`}
              className="w-full h-full object-cover opacity-40"
            />
          )}
          <span className="absolute bottom-0 right-0.5 text-[8px] font-extrabold bg-black/50 text-white px-0.5">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
