'use client';

import { ExternalLink } from 'lucide-react';

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className="neo-panel flex items-center gap-3 px-5 py-3.5 mb-6" style={{ background: 'var(--accent)' }}>
      <div>
        <div className="text-[26px] font-black tracking-tight leading-none">
          ima2-<span className="bg-[var(--text)] text-[var(--accent)] px-1.5">worldcup</span>
        </div>
        <div className="text-[11px] font-bold opacity-70 mt-0.5">Fan Art Style Transfer</div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <a
          href="https://github.com/lidge-jun/ima2-worldcup"
          target="_blank"
          rel="noopener noreferrer"
          className="neo-btn flex items-center gap-1.5"
        >
          <ExternalLink size={14} />
          <span>GitHub</span>
        </a>
        {children}
      </div>
    </header>
  );
}
