'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import GeneratingAnim from '@/components/GeneratingAnim';
import Gallery from '@/components/Gallery';
import GalleryPreview from '@/components/GalleryPreview';
import QueuePanel from '@/components/QueuePanel';
import AuthModal from '@/components/AuthModal';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getCodexToken, saveCodexToken, getGrokToken, saveGrokToken } from '@/lib/auth';
import { createJob, getActiveJob, getNextQueued, type Job } from '@/lib/store/queue';
import { saveToGallery, makeThumbnail, type GalleryItem } from '@/lib/store/gallery';
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
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile();
  const [showGallery, setShowGallery] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // Queue state
  const [jobs, setJobs] = useState<Job[]>([]);
  const processingRef = useRef(false);

  // Current active job display
  const [previewState, setPreviewState] = useState<PreviewState>('idle');
  const [resultB64, setResultB64] = useState('');
  const [resultKind, setResultKind] = useState<'image' | 'gif' | 'video'>('image');
  const [gifUrl, setGifUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [styledFrames, setStyledFrames] = useState<StyledFrame[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | undefined>();
  const [grokStage, setGrokStage] = useState<V2VProgress | undefined>();
  const [error, setError] = useState('');

  // Gallery preview
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(null);

  // Keyframes
  const [keyframes, setKeyframes] = useState<Frame[]>([]);
  const [selectedKeyframe, setSelectedKeyframe] = useState(0);

  // Init auth
  useEffect(() => {
    const ct = getCodexToken();
    const gt = getGrokToken();
    if (ct) setCodexToken(ct);
    if (gt) setGrokToken(gt);
    fetch('/api/detect-auth').then(r => r.json()).then(d => {
      if (d.proxyAvailable) setCodexToken('proxy');
    }).catch(() => {});
  }, []);

  // Read image as b64 for image mode
  useEffect(() => {
    if (!file || mode !== 'image' || !file.type.startsWith('image/')) { setFileB64(''); return; }
    const reader = new FileReader();
    reader.onload = () => setFileB64((reader.result as string).split(',')[1] || '');
    reader.readAsDataURL(file);
  }, [file, mode]);

  // Extract keyframes for single mode
  useEffect(() => {
    if (mode !== 'single' || !file || !file.type.startsWith('video/')) { setKeyframes([]); return; }
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

  const handleFileType = useCallback((type: 'image' | 'video') => {
    setFileType(type);
    if (type === 'video' && mode === 'image') setMode('frames');
    if (type === 'image' && mode !== 'image') setMode('image');
  }, [mode]);

  const hasToken = mode === 'v2v' ? !!grokToken : !!codexToken;

  const addToQueue = () => {
    if (!file || !hasToken) return;
    const job = createJob(file, mode, style, customPrompt, fps);
    setJobs(prev => [...prev, job]);
  };

  // Auto-remove completed jobs after 3 seconds — use ref to avoid timer reset on every jobs change
  const removalTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const timers = removalTimers.current;
    const completed = jobs.filter(j => (j.status === 'done' || j.status === 'error') && j.completedAt);
    for (const j of completed) {
      if (timers.has(j.id)) continue;
      const elapsed = Date.now() - (j.completedAt || 0);
      const remaining = Math.max(0, 3000 - elapsed);
      timers.set(j.id, setTimeout(() => {
        timers.delete(j.id);
        setJobs(prev => prev.filter(p => p.id !== j.id));
      }, remaining));
    }
    for (const [id, t] of timers) {
      if (!jobs.some(j => j.id === id)) { clearTimeout(t); timers.delete(id); }
    }
  }, [jobs]);

  // Process queue
  useEffect(() => {
    if (processingRef.current) return;
    const active = getActiveJob(jobs);
    if (active) return;
    const next = getNextQueued(jobs);
    if (!next) return;

    processingRef.current = true;
    setJobs(prev => prev.map(j => j.id === next.id ? { ...j, status: 'generating' as const } : j));

    processJob(next).then(async (result) => {
      setJobs(prev => prev.map(j => j.id === next.id ? { ...j, ...result, status: 'done' as const, completedAt: Date.now() } : j));

      // Save to gallery — isolated try/catch so failure doesn't poison job status
      try {
        if (result.resultB64 || result.gifUrl) {
          const b64ForThumb = result.resultB64 || '';
          const thumb = b64ForThumb ? await makeThumbnail(b64ForThumb) : '';
          const originalB64 = next.file.type.startsWith('image/')
            ? await fileToB64(next.file)
            : '';
          await saveToGallery({
            id: next.id,
            timestamp: Date.now(),
            fileName: next.fileName,
            style: next.style,
            mode: next.mode,
            originalB64,
            resultB64: result.resultB64,
            thumbB64: thumb,
          });
          window.dispatchEvent(new Event('gallery-updated'));
        }
      } catch (saveErr) {
        console.warn('[gallery] save failed:', saveErr);
      }
    }).catch(err => {
      console.error('[processJob] error:', err);
      const msg = err instanceof Error ? err.message
        : typeof err === 'string' ? err
        : typeof err?.message === 'string' ? err.message
        : JSON.stringify(err) || 'Unknown error';
      setJobs(prev => prev.map(j => j.id === next.id ? { ...j, status: 'error' as const, error: msg, completedAt: Date.now() } : j));
      setError(msg);
      setPreviewState('error');
    }).finally(() => {
      processingRef.current = false;
    });
  }, [jobs, codexToken, grokToken]);

  async function processJob(job: Job): Promise<Partial<Job>> {
    setPreviewState('generating');
    setResultB64(''); setGifUrl(''); setVideoUrl('');
    setStyledFrames([]); setProgress(undefined); setError('');

    if (job.mode === 'image') {
      setResultKind('image');
      const b64 = await fileToB64(job.file);
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageB64: b64, style: job.style, customPrompt: job.customPrompt, token: codexToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed');
      setResultB64(data.resultB64);
      setPreviewState('done');
      return { resultB64: data.resultB64 };
    }

    if (job.mode === 'frames') {
      setResultKind('video');
      const { extractFrames } = await import('@/lib/ffmpeg/extract');
      const extracted = await extractFrames(job.file, job.fps);
      const sf: StyledFrame[] = extracted.map(f => ({ ...f, status: 'pending' as const }));
      setStyledFrames(sf);

      const { generateBatch } = await import('@/lib/generate-batch');
      const results = await generateBatch(extracted, job.style, job.customPrompt, codexToken, (done, total) => {
        setProgress({ current: done, total });
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress: { current: done, total } } : j));
      });
      setStyledFrames(results);

      const doneFrames = results.filter(f => f.status === 'done' && f.styledB64);
      if (!doneFrames.length) throw new Error('All frames failed');

      const blobs = doneFrames.map(f => {
        const bin = atob(f.styledB64!);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new Blob([bytes], { type: 'image/png' });
      });

      const { assembleVideo } = await import('@/lib/ffmpeg/assemble');
      const videoBlob = await assembleVideo(blobs, job.fps);
      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setPreviewState('done');
      return { videoUrl: url, resultB64: doneFrames[0]?.styledB64 };
    }

    if (job.mode === 'single') {
      setResultKind('image');
      const { extractKeyframes } = await import('@/lib/ffmpeg/keyframes');
      const kfs = await extractKeyframes(job.file, 5);
      const kf = kfs[0];
      if (!kf) throw new Error('No keyframes extracted');
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageB64: kf.b64, style: job.style, customPrompt: job.customPrompt, token: codexToken }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed');
      setResultB64(data.resultB64);
      setPreviewState('done');
      return { resultB64: data.resultB64 };
    }

    if (job.mode === 'v2v') {
      setResultKind('video');
      const { grokVideoToVideo } = await import('@/lib/grok/v2v');
      const url = await grokVideoToVideo(job.file, job.style, job.customPrompt, grokToken, (stage) => {
        setGrokStage(stage);
      });
      setVideoUrl(url);
      setPreviewState('done');
      return { videoUrl: url };
    }

    throw new Error('Unknown mode');
  }

  const handleGenerate = () => {
    addToQueue();
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    if (resultKind === 'video' && videoUrl) { a.href = videoUrl; a.download = `ima2wc-${style}.mp4`; }
    else if (resultKind === 'gif' && gifUrl) { a.href = gifUrl; a.download = `ima2wc-${style}.gif`; }
    else if (resultB64) { a.href = `data:image/png;base64,${resultB64}`; a.download = `ima2wc-${style}.png`; }
    else return;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const cancelJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleGalleryRegenerate = (item: GalleryItem) => {
    if (!item.originalB64) return;
    setSelectedGallery(null);
    const blob = b64ToBlob(item.originalB64);
    const restoredFile = new File([blob], item.fileName, { type: 'image/png' });
    setFile(restoredFile);
    setMode('image');
    setStyle(item.style);
    const job = createJob(restoredFile, 'image', item.style, '', 1);
    setJobs(prev => [...prev, job]);
  };

  const handleGalleryRestyle = (item: GalleryItem, newStyle: string) => {
    if (!item.originalB64) return;
    setSelectedGallery(null);
    const blob = b64ToBlob(item.originalB64);
    const restoredFile = new File([blob], item.fileName, { type: 'image/png' });
    setFile(restoredFile);
    setMode('image');
    setStyle(newStyle);
    const job = createJob(restoredFile, 'image', newStyle, '', 1);
    setJobs(prev => [...prev, job]);
  };

  const canGenerate = hasToken && !!file;
  const currentPreviewState: PreviewState = !hasToken ? 'auth-required' : previewState;

  return (
    <div className={`h-[100dvh] grid ${isMobile ? 'grid-cols-[1fr]' : 'grid-cols-[200px_1fr_220px]'}`}>
      {!isMobile && <Gallery onSelect={setSelectedGallery} selectedId={selectedGallery?.id} />}

      <main className="flex flex-col overflow-hidden">
        <Header>
          {isMobile && (
            <div className="flex gap-1 mr-2">
              <button onClick={() => setShowGallery(true)} className="neo-btn text-[10px] font-extrabold px-2 py-1">Gallery</button>
              <button onClick={() => setShowQueue(true)} className="neo-btn text-[10px] font-extrabold px-2 py-1">Queue</button>
            </div>
          )}
          <AuthStatus codexToken={codexToken} grokToken={grokToken} onToken={handleToken} />
        </Header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <Panel title="Upload">
              <UploadZone file={file} onFile={setFile} onFileType={handleFileType} onDuration={setVideoDuration} />
            </Panel>
            <Panel title="Settings">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">Mode</div>
              <ModeSelector mode={mode} onMode={setMode} grokToken={grokToken} fileType={fileType} />
              {mode === 'single' && keyframes.length > 0 && (
                <>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 mt-3 mb-1">Keyframe</div>
                  <KeyframePicker frames={keyframes} selected={selectedKeyframe} onSelect={setSelectedKeyframe} />
                </>
              )}
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500 mt-3 mb-1">Style</div>
              <StylePicker style={style} onStyle={setStyle} customPrompt={customPrompt} onCustomPrompt={setCustomPrompt} />
              {mode === 'frames' && <FpsSlider fps={fps} onFps={setFps} duration={videoDuration} />}
            </Panel>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className={`neo-btn flex-1 py-3 text-[14px] font-black uppercase tracking-widest text-center ${
                canGenerate ? 'neo-btn-accent shadow-[5px_5px_0_var(--shadow)]' : 'opacity-30 cursor-not-allowed'
              }`}
            >
              Generate
            </button>
            <button
              onClick={addToQueue}
              disabled={!canGenerate}
              className={`neo-btn py-3 px-4 text-[11px] font-extrabold uppercase ${
                canGenerate ? '' : 'opacity-30 cursor-not-allowed'
              }`}
            >
              + Queue
            </button>
          </div>

          {/* Preview */}
          <div className="neo-panel relative" style={{ minHeight: '280px' }}>
            <div className="neo-panel-head flex justify-between text-[11px]">
              <span>Preview</span>
              <span style={{ color: currentPreviewState === 'done' ? '#22c55e' : currentPreviewState === 'generating' ? 'var(--accent)' : '#666' }}>
                {currentPreviewState === 'done' ? 'complete' : currentPreviewState === 'generating' ? 'generating...' : 'waiting'}
              </span>
            </div>
            <div className="p-3">
              {previewState === 'generating' ? (
                <div>
                  <GeneratingAnim label={progress ? `Frame ${progress.current}/${progress.total}` : 'Applying style...'} />
                  {styledFrames.length > 0 && (
                    <div className="flex gap-0.5 mt-2">
                      {styledFrames.map((f, i) => (
                        <div key={i} className={`flex-1 h-[5px] border-[1.5px] border-[var(--border)] ${
                          f.status === 'done' ? 'bg-[var(--accent)]' : f.status === 'active' ? 'bg-[var(--hover)]' : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                  )}
                  {progress && <div className="text-[9px] font-extrabold text-center mt-1 text-gray-500">Frame {progress.current}/{progress.total}</div>}
                </div>
              ) : mode === 'v2v' && grokStage ? (
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
                  onAuth={() => setShowAuthModal(true)}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {!isMobile && <QueuePanel jobs={jobs} onCancel={cancelJob} />}

      {isMobile && showGallery && <Gallery onSelect={(item) => { setSelectedGallery(item); setShowGallery(false); }} selectedId={selectedGallery?.id} overlay onClose={() => setShowGallery(false)} />}
      {isMobile && showQueue && <QueuePanel jobs={jobs} onCancel={cancelJob} overlay onClose={() => setShowQueue(false)} />}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSave={handleToken} />}
      {selectedGallery && <GalleryPreview item={selectedGallery} onClose={() => setSelectedGallery(null)} onRegenerate={handleGalleryRegenerate} onRestyle={handleGalleryRestyle} />}
    </div>
  );
}

function fileToB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function b64ToBlob(b64: string, type = 'image/png'): Blob {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}
