'use client';

import type { Frame } from '@/lib/ffmpeg/types';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function KeyframePicker({ frames, selected, onSelect }: {
  frames: Frame[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  if (!frames.length) return null;

  return (
    <div className="grid grid-cols-5 gap-1.5 mt-3">
      {frames.map((f, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`relative border-3 h-[56px] overflow-hidden ${
            selected === i
              ? 'border-[var(--accent)] shadow-[3px_3px_0_var(--shadow)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]'
          }`}
        >
          <img
            src={`data:image/png;base64,${f.b64}`}
            alt={`Keyframe ${formatTime(f.timestamp)}`}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0 left-0 text-[8px] font-extrabold bg-black/60 text-white px-1">
            {formatTime(f.timestamp)}
          </span>
        </button>
      ))}
    </div>
  );
}
