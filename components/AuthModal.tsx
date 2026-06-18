'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink } from 'lucide-react';

export default function AuthModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (token: string) => void;
}) {
  const [token, setToken] = useState('');
  const [masked, setMasked] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!token.trim()) return;
    setValidating(true);
    setError('');
    try {
      const res = await fetch('/api/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        onSave(token.trim());
        onClose();
      } else {
        setError(data.error || 'Invalid token');
      }
    } catch {
      setError('Validation failed — check your network');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="neo-panel w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="neo-panel-head flex items-center justify-between">
          <span>Connect Codex Account</span>
          <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={16} /></button>
        </div>
        <div className="p-5">
          <p className="text-[12px] font-semibold text-gray-600 mb-3">
            Paste your Codex OAuth token. Get it by running:
          </p>
          <code className="block p-2 border-3 border-[var(--border)] bg-[var(--bg)] text-[11px] font-bold mb-4">
            codex auth token
          </code>
          <div className="relative mb-3">
            <input
              type={masked ? 'password' : 'text'}
              value={token}
              onChange={e => { setToken(e.target.value); setError(''); }}
              placeholder="sk-..."
              className="w-full p-2.5 pr-10 border-3 border-[var(--border)] bg-[var(--surface)] text-[12px] font-semibold focus:outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setMasked(!masked)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80"
            >
              {masked ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          {error && <div className="text-[11px] font-bold text-[var(--accent)] mb-3">{error}</div>}
          <p className="text-[10px] text-gray-400 mb-4">
            Token is stored in your browser only (localStorage). Never sent to our server.
          </p>
          <button
            onClick={handleSave}
            disabled={!token.trim() || validating}
            className={`neo-btn neo-btn-accent w-full text-center text-[14px] py-3 ${
              (!token.trim() || validating) ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            {validating ? 'Validating...' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
