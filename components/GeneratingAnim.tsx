'use client';

export default function GeneratingAnim({ label }: { label?: string }) {
  return (
    <div className="w-full aspect-[16/10] border-2 border-gray-300 bg-[#faf8f0] overflow-hidden relative">
      <svg viewBox="0 0 400 250" className="w-full h-full">
        {/* Sky */}
        <rect x="0" y="0" width="400" height="75" fill="#4a90d9" opacity="0.6" />

        {/* Crowd dots popping in */}
        {[40,80,130,180,230,280,330,370].map((cx, i) => (
          <circle
            key={`c${i}`}
            cx={cx}
            cy={15 + (i % 3) * 10}
            r="3"
            fill={['#ef4444','#3b82f6','#fbbf24','#22c55e','#f472b6'][i % 5]}
            opacity="0"
          >
            <animate attributeName="opacity" from="0" to="1" begin={`${0.2 + i * 0.15}s`} dur="0.4s" fill="freeze" />
            <animate attributeName="r" from="0" to="3" begin={`${0.2 + i * 0.15}s`} dur="0.3s" fill="freeze" />
          </circle>
        ))}

        {/* Ad board */}
        <rect x="0" y="65" width="400" height="16" fill="#1e293b" />

        {/* Grass strokes drawn left to right */}
        {[90,100,110,120,130,140,150,160].map((y, i) => (
          <line
            key={`g${i}`}
            x1="10"
            y1={y}
            x2="390"
            y2={y}
            stroke={i % 2 === 0 ? '#4ade80' : '#22c55e'}
            strokeWidth={i % 2 === 0 ? 3 : 4}
            strokeDasharray="800"
            strokeDashoffset="800"
          >
            <animate attributeName="stroke-dashoffset" from="800" to="0" begin={`${0.3 + i * 0.2}s`} dur="2s" fill="freeze" />
          </line>
        ))}

        {/* Field line */}
        <line x1="0" y1="170" x2="400" y2="170" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="5 3" opacity="0">
          <animate attributeName="opacity" from="0" to="1" begin="1.5s" dur="0.5s" fill="freeze" />
        </line>

        {/* Players appearing */}
        {[{cx:90,cy:130,c:'#dbeafe',d:1.8},{cx:180,cy:150,c:'#dbeafe',d:2.0},{cx:310,cy:125,c:'#dbeafe',d:2.2},{cx:140,cy:165,c:'#86efac',d:2.4},{cx:260,cy:145,c:'#86efac',d:2.6},{cx:210,cy:155,c:'#fcd34d',d:2.8}].map((p, i) => (
          <circle key={`p${i}`} cx={p.cx} cy={p.cy} r={p.c === '#fcd34d' ? 4 : 5} fill={p.c} opacity="0">
            <animate attributeName="opacity" from="0" to="1" begin={`${p.d}s`} dur="0.3s" fill="freeze" />
            <animate attributeName="r" from="0" to={p.c === '#fcd34d' ? 4 : 5} begin={`${p.d}s`} dur="0.3s" fill="freeze" />
          </circle>
        ))}

        {/* Hand-drawn score */}
        <g opacity="0">
          <animate attributeName="opacity" from="0" to="1" begin="3s" dur="0.5s" fill="freeze" />
          <rect x="140" y="2" width="120" height="16" rx="3" fill="rgba(255,255,255,0.7)" stroke="#111" strokeWidth="1" />
          <text x="200" y="13" textAnchor="middle" fill="#111" fontSize="9" fontWeight="900" fontFamily="cursive">ARG 0 — 0 ALG</text>
        </g>
      </svg>
      {label && (
        <div className="absolute bottom-2 inset-x-0 text-center text-[10px] font-extrabold text-gray-500">
          {label}
        </div>
      )}
    </div>
  );
}
