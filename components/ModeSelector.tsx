'use client';

import { Image, Film, Camera, Clapperboard, Lock } from 'lucide-react';

type Mode = 'image' | 'frames' | 'single' | 'v2v';

const MODES: { id: Mode; label: string; icon: React.ElementType; locked: boolean }[] = [
  { id: 'image', label: 'Image', icon: Image, locked: false },
  { id: 'frames', label: 'Frames→GIF', icon: Film, locked: true },
  { id: 'single', label: 'Video→1pic', icon: Camera, locked: true },
  { id: 'v2v', label: 'Grok V2V', icon: Clapperboard, locked: true },
];

export default function ModeSelector({ mode, onMode }: {
  mode: Mode;
  onMode: (m: Mode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {MODES.map(m => {
        const Icon = m.icon;
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            disabled={m.locked}
            onClick={() => !m.locked && onMode(m.id)}
            className={`relative p-2.5 border-3 border-[var(--border)] text-center font-extrabold text-[11px] transition-all ${
              active ? 'bg-[var(--accent)] shadow-[3px_3px_0_var(--shadow)]' : 'bg-[var(--surface)]'
            } ${m.locked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--hover)]'}`}
          >
            <Icon size={20} className="mx-auto mb-0.5" />
            {m.label}
            {m.locked && <Lock size={10} className="absolute top-1.5 right-1.5" />}
          </button>
        );
      })}
    </div>
  );
}
