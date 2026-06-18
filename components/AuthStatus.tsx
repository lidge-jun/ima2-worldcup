'use client';

import { useState } from 'react';
import { KeyRound, Check } from 'lucide-react';
import AuthModal from './AuthModal';

export default function AuthStatus({ codexToken, grokToken, onToken }: {
  codexToken: string;
  grokToken: string;
  onToken: (type: 'codex' | 'grok', token: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'codex' | 'grok'>('codex');

  const openModal = (tab: 'codex' | 'grok') => {
    setModalTab(tab);
    setShowModal(true);
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {codexToken ? (
          <button className="neo-btn neo-btn-primary flex items-center gap-1 text-[11px] py-1 px-2.5" onClick={() => openModal('codex')}>
            <Check size={12} /> codex
          </button>
        ) : (
          <button className="neo-btn neo-btn-primary flex items-center gap-1 text-[11px] py-1 px-2.5" onClick={() => openModal('codex')}>
            <KeyRound size={12} /> Sign In
          </button>
        )}
        {grokToken && (
          <button className="neo-btn flex items-center gap-1 text-[11px] py-1 px-2.5 bg-[var(--accent)] border-[var(--border)]" onClick={() => openModal('grok')}>
            <Check size={12} /> grok
          </button>
        )}
      </div>
      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onSave={onToken}
          initialTab={modalTab}
        />
      )}
    </>
  );
}
