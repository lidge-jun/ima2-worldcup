let ffmpeg: any = null;
let loadPromise: Promise<any> | null = null;

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
const FFMPEG_BASE = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm';

export function checkCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
}

async function toBlobURL(url: string, mimeType: string): Promise<string> {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: mimeType });
  return URL.createObjectURL(blob);
}

export async function getFFmpeg(): Promise<any> {
  if (ffmpeg) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!checkCrossOriginIsolated()) {
      throw new Error('SharedArrayBuffer not available. COOP/COEP headers required.');
    }

    console.log('[ffmpeg] loading core + worker from CDN as blob URLs...');

    const [coreURL, wasmURL, workerURL] = await Promise.all([
      toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      toBlobURL(`${FFMPEG_BASE}/worker.js`, 'text/javascript'),
    ]);

    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const instance = new FFmpeg();

    instance.on('log', ({ message }: { message: string }) => {
      console.log('[ffmpeg]', message);
    });

    try {
      await instance.load({ coreURL, wasmURL, classWorkerURL: workerURL });
    } catch (err) {
      loadPromise = null;
      console.error('[ffmpeg] load failed:', err);
      throw new Error(`FFmpeg load failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    console.log('[ffmpeg] loaded successfully');
    ffmpeg = instance;
    return instance;
  })();

  return loadPromise;
}
