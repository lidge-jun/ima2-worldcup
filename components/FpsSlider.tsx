'use client';

const FPS_STEPS = [0.2, 0.33, 0.5, 1, 2, 3, 4, 5];
const FPS_LABELS: Record<number, string> = { 0.2: '1/5s', 0.33: '1/3s', 0.5: '1/2s' };

export default function FpsSlider({ fps, onFps, duration }: {
  fps: number;
  onFps: (fps: number) => void;
  duration: number;
}) {
  const idx = FPS_STEPS.indexOf(fps);
  const current = idx >= 0 ? idx : 0;
  const frameCount = Math.max(1, Math.ceil(duration * fps));

  return (
    <div className="flex items-center gap-2.5 p-2.5 border-3 border-[var(--border)] bg-[var(--surface)] mt-3">
      <span className="text-[11px] font-extrabold whitespace-nowrap">FPS</span>
      <input
        type="range"
        min={0}
        max={FPS_STEPS.length - 1}
        value={current}
        onChange={e => onFps(FPS_STEPS[Number(e.target.value)])}
        className="flex-1"
        style={{ accentColor: 'var(--text)' }}
      />
      <span className="text-sm font-black min-w-[32px] text-right">{FPS_LABELS[FPS_STEPS[current]] || FPS_STEPS[current]}</span>
      {duration > 0 && (
        <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
          → {frameCount} frames
        </span>
      )}
    </div>
  );
}
