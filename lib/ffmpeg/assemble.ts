import { runWithFFmpeg, type FFmpegAPI } from './worker';

// Cap the encode canvas so a stream of large AI frames stays within the WASM
// heap and encodes quickly.
const MAX_CANVAS_DIM = 1280;
const FALLBACK_CANVAS = { width: 1024, height: 1024 };

/**
 * AI-styled frames come back at inconsistent (and often odd) dimensions.
 * libx264 aborts the moment input dimensions change mid-stream, so every frame
 * MUST be forced onto one identical even canvas. Aspect ratio is preserved with
 * letterbox padding; `setsar=1` keeps square pixels.
 */
function uniformCanvasFilter(width: number, height: number): string {
  return [
    `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
    `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
    'setsar=1',
  ].join(',');
}

function fitEven(w: number, h: number, max: number): { width: number; height: number } {
  let width = w;
  let height = h;
  const longest = Math.max(width, height);
  if (longest > max) {
    const scale = max / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  // libx264 with yuv420p requires both dimensions divisible by 2.
  width = Math.max(2, width - (width % 2));
  height = Math.max(2, height - (height % 2));
  return { width, height };
}

/** Pick the encode canvas from the first frame's intrinsic size (capped, even). */
async function resolveCanvasSize(blob: Blob | undefined): Promise<{ width: number; height: number }> {
  if (!blob) return FALLBACK_CANVAS;
  try {
    const bitmap = await createImageBitmap(blob);
    const size = fitEven(bitmap.width, bitmap.height, MAX_CANVAS_DIM);
    bitmap.close();
    return size;
  } catch {
    return FALLBACK_CANVAS;
  }
}

export async function assembleVideo(styledBlobs: Blob[], fps: number, jobId = ''): Promise<Blob> {
  const pfx = jobId ? `${jobId}_` : '';
  const { width, height } = await resolveCanvasSize(styledBlobs[0]);
  return runWithFFmpeg(async (ffmpeg) => {
    const outName = `${pfx}output.mp4`;

    try {
      await writeFrames(ffmpeg, styledBlobs, pfx);
      const exitCode = await ffmpeg.exec([
        '-f', 'image2',
        '-framerate', String(fps),
        '-i', `${pfx}styled_%04d.png`,
        '-vf', uniformCanvasFilter(width, height),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        outName,
      ]);
      if (exitCode !== 0) throw new Error(`FFmpeg MP4 assembly failed with exit code ${exitCode}`);

      const data = await ffmpeg.readFile(outName) as Uint8Array;
      if (data.byteLength === 0) throw new Error('FFmpeg produced an empty MP4');
      const copy = new ArrayBuffer(data.byteLength);
      new Uint8Array(copy).set(data);
      return new Blob([copy], { type: 'video/mp4' });
    } finally {
      await cleanupFrames(ffmpeg, styledBlobs.length, pfx);
      await ffmpeg.deleteFile(outName).catch(() => {});
    }
  });
}

export async function assembleGif(styledBlobs: Blob[], fps: number, jobId = ''): Promise<Blob> {
  const pfx = jobId ? `${jobId}_` : '';
  const { width, height } = await resolveCanvasSize(styledBlobs[0]);
  const filter = uniformCanvasFilter(width, height);
  return runWithFFmpeg(async (ffmpeg) => {
    const outName = `${pfx}output.gif`;

    try {
      await writeFrames(ffmpeg, styledBlobs, pfx);

      // Single-pass high-quality GIF: normalize every frame onto one even
      // canvas, then split so palettegen and paletteuse operate on identical
      // frames. Replaces the two-file palette flow, which silently produced an
      // empty GIF when its second graph failed (no exit-code check).
      const exitCode = await ffmpeg.exec([
        '-f', 'image2',
        '-framerate', String(fps),
        '-i', `${pfx}styled_%04d.png`,
        '-vf', `${filter},split[a][b];[a]palettegen[p];[b][p]paletteuse`,
        '-loop', '0',
        outName,
      ]);
      if (exitCode !== 0) throw new Error(`FFmpeg GIF assembly failed with exit code ${exitCode}`);

      const data = await ffmpeg.readFile(outName) as Uint8Array;
      if (data.byteLength === 0) throw new Error('FFmpeg produced an empty GIF');
      const gifCopy = new ArrayBuffer(data.byteLength);
      new Uint8Array(gifCopy).set(data);
      return new Blob([gifCopy], { type: 'image/gif' });
    } finally {
      await cleanupFrames(ffmpeg, styledBlobs.length, pfx);
      await ffmpeg.deleteFile(outName).catch(() => {});
    }
  });
}

async function writeFrames(ffmpeg: FFmpegAPI, blobs: Blob[], pfx: string): Promise<void> {
  for (let i = 0; i < blobs.length; i++) {
    const name = `${pfx}styled_${String(i + 1).padStart(4, '0')}.png`;
    await ffmpeg.writeFile(name, new Uint8Array(await blobs[i].arrayBuffer()));
  }
}

async function cleanupFrames(ffmpeg: FFmpegAPI, count: number, pfx: string): Promise<void> {
  for (let i = 0; i < count; i++) {
    await ffmpeg.deleteFile(`${pfx}styled_${String(i + 1).padStart(4, '0')}.png`).catch(() => {});
  }
}
