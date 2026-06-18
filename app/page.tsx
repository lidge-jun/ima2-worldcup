'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import AuthStatus from '@/components/AuthStatus';
import Panel from '@/components/Panel';
import UploadZone from '@/components/UploadZone';
import ModeSelector from '@/components/ModeSelector';
import StylePicker from '@/components/StylePicker';
import PreviewPanel from '@/components/PreviewPanel';
import { getCodexToken, saveCodexToken } from '@/lib/auth';

type PreviewState = 'idle' | 'auth-required' | 'generating' | 'done' | 'error';

export default function Home() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileB64, setFileB64] = useState('');
  const [mode, setMode] = useState<'image' | 'frames' | 'single' | 'v2v'>('image');
  const [style, setStyle] = useState('crayon');
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewState, setPreviewState] = useState<PreviewState>('idle');
  const [resultB64, setResultB64] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setToken(getCodexToken());
  }, []);

  useEffect(() => {
    if (!file) { setFileB64(''); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileB64(result.split(',')[1] || '');
    };
    reader.readAsDataURL(file);
  }, [file]);

  const handleToken = useCallback((t: string) => {
    saveCodexToken(t);
    setToken(t);
  }, []);

  const canGenerate = !!token && !!fileB64 && previewState !== 'generating';

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setPreviewState('generating');
    setResultB64('');
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageB64: fileB64, style, customPrompt, token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Generation failed');
        setPreviewState('error');
        return;
      }
      setResultB64(data.resultB64);
      setPreviewState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setPreviewState('error');
    }
  };

  const handleDownload = () => {
    if (!resultB64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${resultB64}`;
    link.download = `ima2wc-${style}-${Date.now()}.png`;
    link.click();
  };

  const currentPreviewState: PreviewState = !token ? 'auth-required' : previewState;

  return (
    <main className="max-w-[960px] mx-auto px-5 py-5">
      <Header>
        <AuthStatus token={token} onToken={handleToken} />
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <Panel title="Upload">
            <UploadZone file={file} onFile={setFile} />
          </Panel>

          <Panel title="Settings">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">Mode</div>
            <ModeSelector mode={mode} onMode={setMode} />

            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mt-4 mb-2">Style</div>
            <StylePicker style={style} onStyle={setStyle} customPrompt={customPrompt} onCustomPrompt={setCustomPrompt} />

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`neo-btn w-full mt-4 py-3.5 text-[16px] font-black uppercase tracking-widest text-center ${
                canGenerate
                  ? 'neo-btn-accent shadow-[6px_6px_0_var(--shadow)]'
                  : 'opacity-30 cursor-not-allowed'
              }`}
            >
              {previewState === 'generating' ? 'Generating...' : 'Generate'}
            </button>
          </Panel>
        </div>

        <Panel
          title="Preview"
          rightSlot={
            <span className="text-[10px] font-semibold" style={{
              color: currentPreviewState === 'done' ? '#22c55e'
                : currentPreviewState === 'generating' ? 'var(--accent)'
                : currentPreviewState === 'error' ? 'var(--accent)'
                : '#666'
            }}>
              {currentPreviewState === 'done' ? 'complete'
                : currentPreviewState === 'generating' ? 'generating...'
                : currentPreviewState === 'error' ? 'error'
                : 'waiting'}
            </span>
          }
        >
          <PreviewPanel
            state={currentPreviewState}
            resultB64={resultB64}
            error={error}
            onDownload={handleDownload}
            onRetry={handleGenerate}
            onAuth={() => {}}
          />
        </Panel>
      </div>
    </main>
  );
}
