'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import AuthStatus from '@/components/AuthStatus';
import Panel from '@/components/Panel';
import UploadZone from '@/components/UploadZone';
import ModeSelector from '@/components/ModeSelector';
import StylePicker from '@/components/StylePicker';
import FpsSlider from '@/components/FpsSlider';
import KeyframePicker from '@/components/KeyframePicker';
import GrokProgress from '@/components/GrokProgress';
import PreviewPanel from '@/components/PreviewPanel';
import { getCodexToken, saveCodexToken, getGrokToken, saveGrokToken } from '@/lib/auth';
import type { Frame, StyledFrame } from '@/lib/ffmpeg/types';
import type { V2VProgress } from '@/lib/grok/v2v';

type PreviewState = 'idle' | 'auth-required' | 'generating' | 'done' | 'error';
type Mode = 'image' | 'frames' | 'single' | 'v2v';

export default function Home() {
  const [codexToken, setCodexToken] = useState('');
  const [grokToken, setGrokToken] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileB64, setFileB64] = useState('');
  const [mode, setMode] = useState<Mode>('image');
  const [style, setStyle] = useState('crayon');
  const [customPrompt, setCustomPrompt] = useState('');
  const [fps, setFps] = useState(1);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewState, setPreviewState] = useState<PreviewState>('idle');
  const [resultB64, setResultB64] = useState('');
  const [resultKind, setResultKind] = useState<'image' | 'gif' | 'video'>('image');
  const [gifUrl, setGifUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [styledFrames, setStyledFrames] = useState<StyledFrame[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | undefined>();
  const [grokStage, setGrokStage] = useState<V2VProgress | undefined>();
  const [error, setError] = useState('');
  const [keyframes, setKeyframes] = useState<Frame[]>([]);
  const [selectedKeyframe, setSelectedKeyframe] = useState(0);

  useEffect(() => {
    setCodexToken(getCodexToken());
    setGrokToken(getGrokToken());
  }, []);

  useEffect(() => {
    if (!file || mode !== 'image' || !file.type.startsWith('image/')) {
      setFileB64('');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFileB64((reader.result as string).split(',')[1] || '');
    reader.readAsDataURL(file);
  }, [file, mode]);

  useEffect(() => {
    if (mode !== 'single' || !file || !file.type.startsWith('video/')) {
      setKeyframes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { extractKeyframes } = await import('@/lib/ffmpeg/keyframes');
      const kfs = await extractKeyframes(file, 5);
      if (!cancelled) { setKeyframes(kfs); setSelectedKeyframe(0); }
    })();
    return () => { cancelled = true; };
  }, [file, mode]);

  const handleToken = useCallback((type: 'codex' | 'grok', token: string) => {
    if (type === 'codex') { saveCodexToken(token); setCodexToken(token); }
    else { saveGrokToken(token); setGrokToken(token); }
  }, []);

  const hasToken = mode === 'v2v' ? !!grokToken : !!codexToken;
  const canGenerate = hasToken && !!file && previewState !== 'generating';

  const resetResults = () => {
    setResultB64(''); setGifUrl(''); setVideoUrl('');
    setStyledFrames([]); setProgress(undefined); setGrokStage(undefined); setError('');
  };

  const handleGenerateImage = async (imageB64?: string) => {
    const b64 = imageB64 || fileB64;
    if (!b64) return;
    setPreviewState('generating');
    resetResults();
    setResultKind('image');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageB64: b64, style, customPrompt, token: codexToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Failed'); setPreviewState('error'); return; }
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
    resetResults();
    setResultKind('gif');
    try {
      const { extractFrames } = await import('@/lib/ffmpeg/extract');
      const extracted = await extractFrames(file, fps);
      const sf: StyledFrame[] = extracted.map(f => ({ ...f, status: 'pending' as const }));
      setStyledFrames(sf);

      const { generateBatch } = await import('@/lib/generate-batch');
      const results = await generateBatch(extracted, style, customPrompt, codexToken, (done, total) => {
        setProgress({ current: done, total });
      });
      setStyledFrames(results);

      const doneFrames = results.filter(f => f.status === 'done' && f.styledB64);
      if (!doneFrames.length) { setError('All frames failed'); setPreviewState('error'); return; }

      const blobs = doneFrames.map(f => {
        const bin = atob(f.styledB64!);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: 'image/png' });
      });

      const { assembleGif } = await import('@/lib/ffmpeg/assemble');
      const gifBlob = await assembleGif(blobs, fps);
      setGifUrl(URL.createObjectURL(gifBlob));
      setPreviewState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline error');
      setPreviewState('error');
    }
  };

  const handleGenerateSingle = async () => {
    if (!keyframes.length) return;
    const kf = keyframes[selectedKeyframe];
    if (!kf) return;
    await handleGenerateImage(kf.b64);
  };

  const handleGenerateV2V = async () => {
    if (!file || !grokToken) return;
    setPreviewState('generating');
    resetResults();
    setResultKind('video');
    try {
      const { grokVideoToVideo } = await import('@/lib/grok/v2v');
      const url = await grokVideoToVideo(file, style, customPrompt, grokToken, (stage, msg) => {
        setGrokStage(stage);
      });
      setVideoUrl(url);
      setPreviewState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Grok V2V error');
      setPreviewState('error');
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    if (mode === 'image') handleGenerateImage();
    else if (mode === 'frames') handleGenerateFrames();
    else if (mode === 'single') handleGenerateSingle();
    else if (mode === 'v2v') handleGenerateV2V();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    if (resultKind === 'video' && videoUrl) { a.href = videoUrl; a.download = `ima2wc-${style}-${Date.now()}.mp4`; }
    else if (resultKind === 'gif' && gifUrl) { a.href = gifUrl; a.download = `ima2wc-${style}-${Date.now()}.gif`; }
    else if (resultB64) { a.href = `data:image/png;base64,${resultB64}`; a.download = `ima2wc-${style}-${Date.now()}.png`; }
    else return;
    a.click();
  };

  const currentPreviewState: PreviewState = !hasToken ? 'auth-required' : previewState;

  return (
    <main className="max-w-[960px] mx-auto px-5 py-5">
      <Header>
        <AuthStatus codexToken={codexToken} grokToken={grokToken} onToken={handleToken} />
      </Header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-4">
          <Panel title="Upload">
            <UploadZone file={file} onFile={setFile} mode={mode} onDuration={setVideoDuration} />
          </Panel>

          <Panel title="Settings">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-2">Mode</div>
            <ModeSelector mode={mode} onMode={setMode} grokToken={grokToken} />

            {mode === 'single' && keyframes.length > 0 && (
              <>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mt-4 mb-2">Select Keyframe</div>
                <KeyframePicker frames={keyframes} selected={selectedKeyframe} onSelect={setSelectedKeyframe} />
              </>
            )}

            <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mt-4 mb-2">Style</div>
            <StylePicker style={style} onStyle={setStyle} customPrompt={customPrompt} onCustomPrompt={setCustomPrompt} />

            {mode === 'frames' && (
              <FpsSlider fps={fps} onFps={setFps} duration={videoDuration} />
            )}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`neo-btn w-full mt-4 py-3.5 text-[16px] font-black uppercase tracking-widest text-center ${
                canGenerate ? 'neo-btn-accent shadow-[6px_6px_0_var(--shadow)]' : 'opacity-30 cursor-not-allowed'
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
          {mode === 'v2v' && previewState === 'generating' && grokStage ? (
            <GrokProgress stage={grokStage} />
          ) : (
            <PreviewPanel
              state={currentPreviewState}
              resultKind={resultKind}
              resultB64={resultB64}
              gifUrl={gifUrl}
              videoUrl={videoUrl}
              frames={styledFrames.length > 0 ? styledFrames : undefined}
              progress={progress}
              grokStage={grokStage ? String(grokStage) : undefined}
              error={error}
              onDownload={handleDownload}
              onRetry={handleGenerate}
              onAuth={() => {}}
            />
          )}
        </Panel>
      </div>
    </main>
  );
}
