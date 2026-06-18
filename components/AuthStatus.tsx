'use client';

import { useState } from 'react';
import { KeyRound, Check } from 'lucide-react';
import AuthModal from './AuthModal';

export default function AuthStatus({ token, onToken }: {
  token: string;
  onToken: (t: string) => void;
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      {token ? (
        <button className="neo-btn neo-btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
          <Check size={14} />
          <span>codex</span>
        </button>
      ) : (
        <button className="neo-btn neo-btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
          <KeyRound size={14} />
          <span>Sign In</span>
        </button>
      )}
      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onSave={onToken}
        />
      )}
    </>
  );
}
