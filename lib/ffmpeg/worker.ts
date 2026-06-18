let ffmpeg: any = null;
let loadPromise: Promise<any> | null = null;

const CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js';
const WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm';

export function checkCrossOriginIsolated(): boolean {
  return typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
}

export async function getFFmpeg(): Promise<any> {
  if (ffmpeg) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!checkCrossOriginIsolated()) {
      throw new Error('SharedArrayBuffer not available. COOP/COEP headers required.');
    }

    console.log('[ffmpeg] loading...');

    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const instance = new FFmpeg();

    instance.on('log', ({ message }: { message: string }) => {
      console.log('[ffmpeg]', message);
    });

    try {
      const coreURL = await toBlobURL(CORE_URL, 'text/javascript');
      const wasmURL = await toBlobURL(WASM_URL, 'application/wasm');
      await instance.load({ coreURL, wasmURL });
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
