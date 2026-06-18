'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import AuthStatus from '@/components/AuthStatus';
import Panel from '@/components/Panel';
import UploadZone from '@/components/UploadZone';
import ModeSelector from '@/components/ModeSelector';
import StylePicker from '@/components/StylePicker';
import FpsSlider from '@/components/FpsSlider';
import PreviewPanel from '@/components/PreviewPanel';
import { getCodexToken, saveCodexToken } from '@/lib/auth';
import type { StyledFrame } from '@/lib/ffmpeg/types';

type PreviewState = 'idle' | 'auth-required' | 'generating' | 'done' | 'error';
type Mode = 'image' | 'frames' | 'single' | 'v2v';

export default function Home() {
  const [token, setToken] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileB64, setFileB64] = useState('');
  const [mode, setMode] = useState<Mode>('image');
  const [style, setStyle] = useState('crayon');
  const [customPrompt, setCustomPrompt] = useState('');
  const [fps, setFps] = useState(1);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewState, setPreviewState] = useState<PreviewState>('idle');
  const [resultB64, setResultB64] = useState('');
  const [resultKind, setResultKind] = useState<'image' | 'gif'>('image');
  const [gifUrl, setGifUrl] = useState('');
  const [frames, setFrames] = useState<StyledFrame[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | undefined>();
  const [error, setError] = useState('');

  useEffect(() => { setToken(getCodexToken()); }, []);

  useEffect(() => {
    if (!file || mode !== 'image' || !file.type.startsWith('image/')) {
      setFileB64('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFileB64(result.split(',')[1] || '');
    };
    reader.readAsDataURL(file);
  }, [file, mode]);

  const handleToken = useCallback((t: string) => {
    saveCodexToken(t);
    setToken(t);
  }, []);

  const canGenerate = !!token && !!file && previewState !== 'generating';

  const handleGenerateImage = async () => {
    if (!fileB64) return;
    setPreviewState('generating');
    setResultB64('');
    setResultKind('image');
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

  const handleGenerateFrames = async () => {
    if (!file) return;
    setPreviewState('generating');
    setResultKind('gif');
    setGifUrl('');
    setError('');
    setProgress(undefined);

    try {
      const { extractFrames } = await import('@/lib/ffmpeg/extract');
      const extracted = await extractFrames(file, fps);
      const styledFrames: StyledFrame[] = extracted.map(f => ({ ...f, status: 'pending' as const }));
      setFrames(styledFrames);

      const { generateBatch } = await import('@/lib/generate-batch');
      const results = await generateBatch(
        extracted, style, customPrompt, token,
        (done, total, idx) => {
          setProgress({ current: done, total });
          setFrames(prev => {
            const next = [...prev];
            if (next[idx]) next[idx] = { ...next[idx], ...results[idx] };
            return next;
          });
        },
      );

      setFrames(results);

      const doneFrames = results.filter(f => f.status === 'done' && f.styledB64);
      if (doneFrames.length === 0) {
        setError('All frames failed');
        setPreviewState('error');
        return;
      }

      const styledBlobs = doneFrames.map(f => {
        const binary = atob(f.styledB64!);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: 'image/png' });
      });

      const { assembleGif } = await import('@/lib/ffmpeg/assemble');
      const gifBlob = await assembleGif(styledBlobs, fps);
      const url = URL.createObjectURL(gifBlob);
      setGifUrl(url);
      setPreviewState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline error');
      setPreviewState('error');
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    if (mode === 'frames') handleGenerateFrames();
    else handleGenerateImage();
  };

  const handleDownload = () => {
    if (resultKind === 'gif' && gifUrl) {
      const a = document.createElement('a');
      a.href = gifUrl;
      a.download = `ima2wc-${style}-${Date.now()}.gif`;
      a.click();
    } else if (resultB64) {
      const a = document.createElement('a');
      a.href = `data:image/png;base64,${resultB64}`;
      a.download = `ima2wc-${style}-${Date.now()}.png`;
      a.click();
    }
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
            <UploadZone file={file} onFile={setFile} mode={mode} onDuration={setVideoDuration} />
          </Panel>

          <Panel title="Settings">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">Mode</div>
            <ModeSelector mode={mode} onMode={setMode} />

            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mt-4 mb-2">Style</div>
            <StylePicker style={style} onStyle={setStyle} customPrompt={customPrompt} onCustomPrompt={setCustomPrompt} />

            {mode === 'frames' && (
              <FpsSlider fps={fps} onFps={setFps} duration={videoDuration} />
            )}

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
            resultKind={resultKind}
            resultB64={resultB64}
            gifUrl={gifUrl}
            frames={frames.length > 0 ? frames : undefined}
            progress={progress}
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
