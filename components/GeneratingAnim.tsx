'use client';

export default function GeneratingAnim({ label }: { label?: string }) {
  return (
    <div className="w-full aspect-[16/10] border-2 border-gray-300 bg-[#faf8f0] overflow-hidden relative">
      <svg viewBox="0 0 400 250" className="w-full h-full anim-field">
        <rect x="0" y="0" width="400" height="75" fill="#4a90d9" opacity="0.6" />
        <rect x="0" y="65" width="400" height="16" fill="#1e293b" />

        {[90,100,110,120,130,140,150,160].map((y, i) => (
          <line key={`g${i}`} x1="10" y1={y} x2="390" y2={y}
            stroke={i % 2 === 0 ? '#4ade80' : '#22c55e'} strokeWidth={i % 2 === 0 ? 3 : 4}
            className="grass-line" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}

        <line x1="0" y1="170" x2="400" y2="170" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="5 3" />

        {[40,80,130,180,230,280,330,370].map((cx, i) => (
          <circle key={`c${i}`} cx={cx} cy={15 + (i % 3) * 10} r="3"
            fill={['#ef4444','#3b82f6','#fbbf24','#22c55e','#f472b6'][i % 5]}
            className="crowd-dot" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}

        {[{cx:90,cy:130,c:'#dbeafe'},{cx:180,cy:150,c:'#dbeafe'},{cx:310,cy:125,c:'#dbeafe'},{cx:140,cy:165,c:'#86efac'},{cx:260,cy:145,c:'#86efac'}].map((p, i) => (
          <circle key={`p${i}`} cx={p.cx} cy={p.cy} r="5" fill={p.c}
            className="player-dot" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}

        <circle cx="210" cy="155" r="4" fill="#fcd34d" className="ball-dot" />

        <g className="score-box">
          <rect x="140" y="2" width="120" height="16" rx="3" fill="rgba(255,255,255,0.7)" stroke="#111" strokeWidth="1" />
          <text x="200" y="13" textAnchor="middle" fill="#111" fontSize="9" fontWeight="900" fontFamily="cursive">ARG 0 — 0 ALG</text>
        </g>
      </svg>

      {label && (
        <div className="absolute bottom-2 inset-x-0 text-center text-[10px] font-extrabold text-gray-500">
          {label}
        </div>
      )}

      <style jsx>{`
        .grass-line {
          animation: sway 2s ease-in-out infinite alternate;
          transform-origin: 200px 130px;
        }
        @keyframes sway {
          0% { transform: translateY(-1px); opacity: 0.7; }
          100% { transform: translateY(1px); opacity: 1; }
        }
        .crowd-dot {
          animation: bounce 1.2s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        .player-dot {
          animation: shift 3s ease-in-out infinite alternate;
        }
        @keyframes shift {
          0% { transform: translate(0, 0); }
          50% { transform: translate(5px, -3px); }
          100% { transform: translate(-3px, 2px); }
        }
        .ball-dot {
          animation: roll 1.5s ease-in-out infinite;
        }
        @keyframes roll {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(8px, -2px); }
          50% { transform: translate(12px, 0); }
          75% { transform: translate(4px, 2px); }
        }
        .score-box {
          animation: pulse-score 2s ease-in-out infinite;
        }
        @keyframes pulse-score {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
