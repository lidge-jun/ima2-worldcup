'use client';

/**
 * Deterministic FFmpeg pipeline QA harness.
 *
 * Exercises the real browser FFmpeg modules (extract / keyframes / assemble)
 * with controlled synthetic frames — including the pathological case of
 * AI-styled frames that come back at *inconsistent* odd dimensions, which is
 * what libx264 rejects mid-stream. No proxy / AI generation required, so this
 * is a repeatable regression check for the recurring zero-byte/failed MP4 bug.
 *
 * Visit /qa and the suite runs on mount. Results are mirrored to
 * window.__QA_RESULTS__ and the console for automated inspection.
 */

import { useEffect, useState } from 'react';

type Status = 'pending' | 'running' | 'pass' | 'fail';
interface TestResult {
  name: string;
  status: Status;
  detail: string;
}

declare global {
  interface Window {
    __QA_RESULTS__?: TestResult[];
    __QA_DONE__?: boolean;
  }
}

function makeFramePng(w: number, h: number, hue: number, label: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  ctx.fillStyle = `hsl(${hue}, 70%, 55%)`;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(24, Math.floor(h / 8))}px sans-serif`;
  ctx.fillText(label, 16, Math.floor(h / 2));
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob null'))), 'image/png');
  });
}

function probeVideo(blob: Blob): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    const cleanup = () => URL.revokeObjectURL(url);
    v.onloadedmetadata = () => {
      const out = { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
      cleanup();
      resolve(out);
    };
    v.onerror = () => {
      cleanup();
      reject(new Error('video element failed to load blob'));
    };
    v.src = url;
  });
}

function blobToB64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function b64ToBlob(b64: string, type = 'image/png'): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

async function generateStyled(srcB64: string, style: string): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageB64: srcB64, style, customPrompt: '', token: 'proxy' }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
  if (!data.resultB64) throw new Error('no resultB64 from /api/generate');
  return data.resultB64 as string;
}

export default function QAPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const acc: TestResult[] = [];
    const publish = () => {
      if (cancelled) return;
      window.__QA_RESULTS__ = [...acc];
      setResults([...acc]);
    };
    const run = async (name: string, fn: () => Promise<string>) => {
      const entry: TestResult = { name, status: 'running', detail: '' };
      acc.push(entry);
      publish();
      try {
        entry.detail = await fn();
        entry.status = 'pass';
        console.log(`[qa] PASS ${name} — ${entry.detail}`);
      } catch (err) {
        entry.status = 'fail';
        entry.detail = err instanceof Error ? err.message : String(err);
        console.error(`[qa] FAIL ${name} — ${entry.detail}`);
      }
      publish();
    };

    (async () => {
      const { assembleVideo, assembleGif } = await import('@/lib/ffmpeg/assemble');
      const { extractFrames } = await import('@/lib/ffmpeg/extract');
      const { extractKeyframes } = await import('@/lib/ffmpeg/keyframes');

      // The core regression: AI-styled frames at DIFFERENT odd dimensions.
      const varied = await Promise.all([
        makeFramePng(1681, 935, 0, 'F1 1681x935'),
        makeFramePng(1671, 941, 60, 'F2 1671x941'),
        makeFramePng(1280, 721, 120, 'F3 1280x721'),
        makeFramePng(1024, 1024, 200, 'F4 1024x1024'),
      ]);

      let variedMp4: Blob | null = null;
      await run('assembleVideo: varying odd dimensions → playable MP4', async () => {
        const blob = await assembleVideo(varied, 2, 'qa-varied');
        if (blob.size === 0) throw new Error('MP4 blob is 0 bytes');
        if (blob.type !== 'video/mp4') throw new Error(`unexpected type ${blob.type}`);
        const meta = await probeVideo(blob);
        if (!(meta.duration > 0)) throw new Error(`duration not positive: ${meta.duration}`);
        if (meta.width % 2 !== 0 || meta.height % 2 !== 0) throw new Error(`odd output dims ${meta.width}x${meta.height}`);
        variedMp4 = blob;
        return `size=${blob.size}B dims=${meta.width}x${meta.height} duration=${meta.duration.toFixed(2)}s`;
      });

      await run('assembleVideo: single odd frame → playable MP4', async () => {
        const one = [await makeFramePng(999, 555, 30, 'solo')];
        const blob = await assembleVideo(one, 1, 'qa-single');
        if (blob.size === 0) throw new Error('MP4 blob is 0 bytes');
        const meta = await probeVideo(blob);
        if (meta.width % 2 !== 0 || meta.height % 2 !== 0) throw new Error(`odd output dims ${meta.width}x${meta.height}`);
        return `size=${blob.size}B dims=${meta.width}x${meta.height} duration=${meta.duration.toFixed(2)}s`;
      });

      await run('assembleGif: varying odd dimensions → non-empty GIF', async () => {
        const blob = await assembleGif(varied, 2, 'qa-gif');
        if (blob.size === 0) throw new Error('GIF blob is 0 bytes');
        if (blob.type !== 'image/gif') throw new Error(`unexpected type ${blob.type}`);
        return `size=${blob.size}B`;
      });

      await run('extractFrames: MP4 → frames round-trip', async () => {
        if (!variedMp4) throw new Error('no MP4 from assembleVideo test');
        const file = new File([variedMp4], 'qa-roundtrip.mp4', { type: 'video/mp4' });
        const frames = await extractFrames(file, 2, 'qa-extract');
        if (frames.length === 0) throw new Error('no frames extracted');
        if (!frames[0].b64) throw new Error('frame b64 empty');
        return `frames=${frames.length} firstB64len=${frames[0].b64.length}`;
      });

      await run('extractKeyframes: MP4 → keyframes', async () => {
        if (!variedMp4) throw new Error('no MP4 from assembleVideo test');
        const file = new File([variedMp4], 'qa-kf.mp4', { type: 'video/mp4' });
        const kfs = await extractKeyframes(file, 5, 'qa-kf');
        if (kfs.length === 0) throw new Error('no keyframes extracted');
        if (!kfs[0].b64) throw new Error('keyframe b64 empty');
        return `keyframes=${kfs.length} firstB64len=${kfs[0].b64.length}`;
      });

      // Live integration: real proxy-backed AI generation feeds assembleVideo.
      // Proves the actual (non-synthetic) AI output dimensions survive the
      // uniform-canvas normalization. Opt-in via /qa?live=1 so the default run
      // stays fast and offline (no API calls / cost on every load).
      const liveEnabled = typeof location !== 'undefined' && new URLSearchParams(location.search).has('live');
      if (liveEnabled) await run('LIVE: real AI generate → assembleVideo (proxy, real dims)', async () => {
        const detect = await fetch('/api/detect-auth').then(r => r.json()).catch(() => ({}));
        if (!detect.proxyAvailable) return 'skipped: no proxy (set OAUTH proxy on :10531)';
        const srcB64 = await blobToB64(await makeFramePng(512, 512, 180, 'src'));
        const styles = ['crayon', 'watercolor'];
        const styled: Blob[] = [];
        const inputDims: string[] = [];
        for (const s of styles) {
          const resultB64 = await generateStyled(srcB64, s);
          const blob = b64ToBlob(resultB64);
          const bmp = await createImageBitmap(blob);
          inputDims.push(`${bmp.width}x${bmp.height}`);
          bmp.close();
          styled.push(blob);
        }
        const mp4 = await assembleVideo(styled, 1, 'qa-live');
        if (mp4.size === 0) throw new Error('live MP4 is 0 bytes');
        const meta = await probeVideo(mp4);
        if (!(meta.duration > 0)) throw new Error(`live MP4 duration not positive: ${meta.duration}`);
        if (meta.width % 2 !== 0 || meta.height % 2 !== 0) throw new Error(`odd output dims ${meta.width}x${meta.height}`);
        return `aiDims=[${inputDims.join(', ')}] → mp4 ${mp4.size}B ${meta.width}x${meta.height} ${meta.duration.toFixed(2)}s`;
      });

      if (cancelled) return;
      window.__QA_DONE__ = true;
      setDone(true);
      const failed = acc.filter(r => r.status === 'fail').length;
      console.log(`[qa] SUITE DONE — ${acc.length - failed}/${acc.length} passed`);
    })();

    return () => { cancelled = true; };
  }, []);

  const failed = results.filter(r => r.status === 'fail').length;
  const passed = results.filter(r => r.status === 'pass').length;

  return (
    <main style={{ fontFamily: 'monospace', padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontWeight: 800 }}>FFmpeg Pipeline QA</h1>
      <div data-qa-summary style={{ margin: '12px 0', fontWeight: 700 }}>
        {done ? `DONE: ${passed} passed, ${failed} failed` : 'running…'}
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {results.map((r, i) => (
          <li key={i} data-qa-test={r.name} data-qa-status={r.status}
            style={{ padding: '8px 0', borderBottom: '1px solid #ddd' }}>
            <span style={{
              color: r.status === 'pass' ? '#16a34a' : r.status === 'fail' ? '#dc2626' : '#999',
              fontWeight: 800,
            }}>
              [{r.status.toUpperCase()}]
            </span>{' '}
            {r.name}
            <div style={{ color: '#555', fontSize: 12, marginTop: 2 }}>{r.detail}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
