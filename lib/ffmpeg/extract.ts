import { runWithFFmpeg, type FFmpegAPI } from './worker';
import type { Frame } from './types';

export async function extractFrames(file: File, fps: number, jobId = ''): Promise<Frame[]> {
  const pfx = jobId ? `${jobId}_` : '';
  console.log(`[extract] start: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) @ ${fps}fps [${pfx || 'default'}]`);

  return runWithFFmpeg(async (ffmpeg) => {
    const inputName = `${pfx}input${getExtension(file.name)}`;
    const frames: Frame[] = [];

    try {
      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

      const exitCode = await ffmpeg.exec([
        '-i', inputName,
        '-vf', `fps=${fps},scale='min(1024,iw)':'-1':flags=lanczos`,
        '-f', 'image2',
        `${pfx}frame_%04d.png`,
      ]);
      console.log('[extract] ffmpeg exit code:', exitCode);

      for (let i = 1; ; i++) {
        const name = getFrameName(pfx, i);
        try {
          const data = await ffmpeg.readFile(name) as Uint8Array;
          const buf = new ArrayBuffer(data.byteLength);
          new Uint8Array(buf).set(data);
          const blob = new Blob([buf], { type: 'image/png' });
          const b64 = await blobToBase64(blob);
          frames.push({ index: i - 1, timestamp: (i - 1) / fps, blob, b64 });
          await ffmpeg.deleteFile(name).catch(() => {});
        } catch {
          break;
        }
      }

      return frames;
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await cleanupFrameFiles(ffmpeg, pfx, frames.length + 2);
    }
  });
}

function getFrameName(pfx: string, index: number): string {
  return `${pfx}frame_${String(index).padStart(4, '0')}.png`;
}

async function cleanupFrameFiles(
  ffmpeg: FFmpegAPI,
  pfx: string,
  count: number,
): Promise<void> {
  for (let i = 1; i <= count; i++) {
    await ffmpeg.deleteFile(getFrameName(pfx, i)).catch(() => {});
  }
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'mov') return '.mov';
  if (ext === 'webm') return '.webm';
  return '.mp4';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
