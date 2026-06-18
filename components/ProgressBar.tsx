'use client';

export default function ProgressBar({ current, total, label }: {
  current: number;
  total: number;
  label?: string;
}) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mt-2">
      <div className="h-2.5 border-2 border-[var(--border)] bg-gray-100 overflow-hidden">
        <div
          className="h-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: 'repeating-linear-gradient(45deg, var(--accent), var(--accent) 8px, #111 8px, #111 16px)',
            backgroundSize: '22.6px 100%',
            animation: 'stripe 0.5s linear infinite',
          }}
        />
      </div>
      <div className="text-[10px] font-extrabold text-center mt-1 text-gray-500">
        {label || `${current}/${total}`} ({pct}%)
      </div>
      <style jsx>{`
        @keyframes stripe {
          0% { background-position: 0 0; }
          100% { background-position: 22.6px 0; }
        }
      `}</style>
    </div>
  );
}
