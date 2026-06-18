'use client';

import { Image, Film, Camera, Clapperboard, Lock } from 'lucide-react';

type Mode = 'image' | 'frames' | 'single' | 'v2v';

const MODES: { id: Mode; label: string; icon: React.ElementType; badge?: string; needsVideo?: boolean; needsImage?: boolean }[] = [
  { id: 'image', label: 'Image', icon: Image, needsImage: true },
  { id: 'frames', label: 'Frames→GIF', icon: Film, needsVideo: true },
  { id: 'single', label: 'Video→1pic', icon: Camera, needsVideo: true },
  { id: 'v2v', label: 'Grok V2V', icon: Clapperboard, badge: 'GROK', needsVideo: true },
];

export default function ModeSelector({ mode, onMode, grokToken, fileType }: {
  mode: Mode;
  onMode: (m: Mode) => void;
  grokToken?: string;
  fileType?: 'image' | 'video' | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {MODES.map(m => {
        const Icon = m.icon;
        const active = mode === m.id;
        const needsGrok = m.id === 'v2v' && !grokToken;
        const incompatible = fileType === 'video' && m.needsImage
          ? true
          : fileType === 'image' && m.needsVideo
          ? true
          : false;
        const disabled = incompatible;

        return (
          <button
            key={m.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onMode(m.id)}
            className={`relative p-2.5 border-3 border-[var(--border)] text-center font-extrabold text-[11px] transition-all ${
              active ? 'bg-[var(--accent)] shadow-[3px_3px_0_var(--shadow)]' : 'bg-[var(--surface)]'
            } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--hover)]'}`}
          >
            <Icon size={20} className="mx-auto mb-0.5" />
            {m.label}
            {m.badge && (
              <span className="absolute top-1 right-1 text-[8px] font-black bg-[var(--text)] text-[var(--bg)] px-1">
                {m.badge}
              </span>
            )}
            {disabled && <Lock size={10} className="absolute top-1.5 right-1.5" />}
            {needsGrok && !disabled && (
              <span className="block text-[8px] font-bold text-gray-400 mt-0.5">needs grok token</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
