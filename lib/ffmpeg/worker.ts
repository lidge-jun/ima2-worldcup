let ffmpeg: any = null;
let loadPromise: Promise<any> | null = null;

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

    console.log('[ffmpeg] loading from /ffmpeg/ (local)...');

    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const instance = new FFmpeg();

    instance.on('log', ({ message }: { message: string }) => {
      console.log('[ffmpeg]', message);
    });

    try {
      await instance.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
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
