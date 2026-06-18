'use client';

const FPS_PRESETS = [1, 2, 3, 4, 5];

export default function FpsSlider({ fps, onFps, duration }: {
  fps: number;
  onFps: (fps: number) => void;
  duration: number;
}) {
  const frameCount = Math.max(1, Math.ceil(duration * fps));

  return (
    <div className="flex items-center gap-2 p-2.5 border-3 border-[var(--border)] bg-[var(--surface)] mt-3">
      <span className="text-[11px] font-extrabold whitespace-nowrap">FPS</span>
      <div className="flex gap-1">
        {FPS_PRESETS.map(v => (
          <button
            key={v}
            onClick={() => onFps(v)}
            className={`neo-btn text-[11px] font-extrabold px-2.5 py-1 ${fps === v ? 'neo-btn-accent' : ''}`}
          >
            {v}
          </button>
        ))}
      </div>
      {duration > 0 && (
        <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap ml-auto">
          → {frameCount} frames
        </span>
      )}
    </div>
  );
}
