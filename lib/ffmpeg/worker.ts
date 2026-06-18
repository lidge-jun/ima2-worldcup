import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

export function checkCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
}

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!checkCrossOriginIsolated()) {
      throw new Error('SharedArrayBuffer not available. COOP/COEP headers required.');
    }

    console.log('[ffmpeg] loading core from CDN...');
    const instance = new FFmpeg();

    instance.on('log', ({ message }) => {
      console.log('[ffmpeg]', message);
    });

    try {
      await instance.load({
        coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
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
