'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Check, Wifi, WifiOff } from 'lucide-react';
import AuthModal from './AuthModal';

export default function AuthStatus({ codexToken, grokToken, onToken }: {
  codexToken: string;
  grokToken: string;
  onToken: (type: 'codex' | 'grok', token: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'codex' | 'grok'>('codex');
  const [proxyStatus, setProxyStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/detect-auth')
      .then(r => r.json())
      .then(d => {
        setProxyStatus(d.proxyAvailable ? 'online' : 'offline');
        if (d.models) setModels(d.models);
      })
      .catch(() => setProxyStatus('offline'));
  }, []);

  const openModal = (tab: 'codex' | 'grok') => {
    setModalTab(tab);
    setShowModal(true);
  };

  const isProxy = codexToken === 'proxy';

  return (
    <>
      <div className="flex items-center gap-1">
        {proxyStatus === 'online' ? (
          <div className="neo-btn neo-btn-primary flex items-center gap-1 text-[11px] py-1 px-2.5 cursor-default">
            <Wifi size={12} />
            <span>OAuth Proxy</span>
          </div>
        ) : codexToken && !isProxy ? (
          <button className="neo-btn neo-btn-primary flex items-center gap-1 text-[11px] py-1 px-2.5" onClick={() => openModal('codex')}>
            <Check size={12} /> API Key
          </button>
        ) : (
          <button className="neo-btn neo-btn-primary flex items-center gap-1 text-[11px] py-1 px-2.5" onClick={() => openModal('codex')}>
            <WifiOff size={12} /> Connect
          </button>
        )}
        {grokToken ? (
          <button className="neo-btn flex items-center gap-1 text-[11px] py-1 px-2.5 bg-[var(--accent)] border-[var(--border)]" onClick={() => openModal('grok')}>
            <Check size={12} /> grok
          </button>
        ) : (
          <button className="neo-btn flex items-center gap-1 text-[11px] py-1 px-2.5" onClick={() => openModal('grok')}>
            <KeyRound size={12} /> Grok
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
