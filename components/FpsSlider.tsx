'use client';

const FPS_STEPS = [0.33, 0.5, 1, 1.5, 2, 2.5, 3];
const FPS_LABELS = ['1/3s', '1/2s', '1/s', '1.5/s', '2/s', '2.5/s', '3/s'];

export default function FpsSlider({ fps, onFps, duration }: {
  fps: number;
  onFps: (fps: number) => void;
  duration: number;
}) {
  const stepIndex = FPS_STEPS.indexOf(fps);
  const idx = stepIndex >= 0 ? stepIndex : 2;
  const frameCount = Math.max(1, Math.ceil(duration * fps));

  return (
    <div className="flex items-center gap-2.5 p-2.5 border-3 border-[var(--border)] bg-[var(--surface)] mt-3">
      <span className="text-[11px] font-extrabold whitespace-nowrap">FPS</span>
      <input
        type="range"
        min={0}
        max={FPS_STEPS.length - 1}
        value={idx}
        onChange={e => onFps(FPS_STEPS[Number(e.target.value)])}
        className="flex-1"
        style={{ accentColor: 'var(--text)' }}
      />
      <span className="text-sm font-black min-w-[40px] text-right">{FPS_LABELS[idx]}</span>
      {duration > 0 && (
        <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
          → {frameCount} frames
        </span>
      )}
    </div>
  );
}
