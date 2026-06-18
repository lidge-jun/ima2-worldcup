'use client';

import { useState } from 'react';

const PRESETS = ['crayon', 'watercolor', 'oil', 'sketch', 'anime', 'custom'] as const;

export default function StylePicker({ style, onStyle, customPrompt, onCustomPrompt }: {
  style: string;
  onStyle: (s: string) => void;
  customPrompt: string;
  onCustomPrompt: (s: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onStyle(s)}
            className={`px-3.5 py-1.5 border-3 border-[var(--border)] font-extrabold text-[11px] capitalize transition-all ${
              style === s
                ? 'bg-[var(--accent)] shadow-[2px_2px_0_var(--shadow)]'
                : 'bg-[var(--surface)] hover:bg-[var(--hover)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {style === 'custom' && (
        <textarea
          value={customPrompt}
          onChange={e => onCustomPrompt(e.target.value)}
          placeholder="Describe your style..."
          className="mt-3 w-full h-14 p-2.5 border-3 border-[var(--border)] bg-[var(--surface)] text-[12px] font-semibold resize-none focus:outline-none focus:border-[var(--accent)]"
        />
      )}
    </div>
  );
}
