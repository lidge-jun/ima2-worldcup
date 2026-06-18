import { runWithFFmpeg, type FFmpegAPI } from './worker';
import type { Frame } from './types';

export async function extractKeyframes(file: File, count = 5, jobId = ''): Promise<Frame[]> {
  const pfx = jobId ? `${jobId}_` : '';
  const duration = await getVideoDuration(file);
  const timestamps = getKeyframeTimestamps(duration, count);

  return runWithFFmpeg(async (ffmpeg) => {
    const inputName = `${pfx}kf_input${getExtension(file.name)}`;
    const frames: Frame[] = [];

    try {
      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const outName = getKeyframeName(pfx, i + 1);
        const exitCode = await ffmpeg.exec([
          '-ss', String(timestamp),
          '-i', inputName,
          '-frames:v', '1',
          '-vf', `scale='min(1024,iw)':'-1':flags=lanczos`,
          '-f', 'image2',
          outName,
        ]);
        if (exitCode !== 0) {
          console.warn(`[keyframes] ffmpeg skipped timestamp ${timestamp.toFixed(3)}s with exit code ${exitCode}`);
          continue;
        }

        try {
          const data = await ffmpeg.readFile(outName) as Uint8Array;
          if (data.byteLength === 0) {
            console.warn(`[keyframes] empty frame at ${timestamp.toFixed(3)}s`);
            continue;
          }
          const buf = new ArrayBuffer(data.byteLength);
          new Uint8Array(buf).set(data);
          const blob = new Blob([buf], { type: 'image/png' });
          const b64 = await blobToBase64(blob);
          frames.push({ index: frames.length, timestamp, blob, b64 });
          await ffmpeg.deleteFile(outName);
        } catch (error) {
          console.warn(`[keyframes] missing frame at ${timestamp.toFixed(3)}s`, error);
        }
      }

      return frames;
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await cleanupKeyframes(ffmpeg, pfx, count);
    }
  });
}

function getKeyframeTimestamps(duration: number, count: number): number[] {
  const frameCount = Math.max(1, Math.floor(count));
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;
  if (safeDuration <= 1.5) return [0];
  const maxTimestamp = Math.max(0, safeDuration - 0.001);
  if (frameCount === 1 || maxTimestamp === 0) return [0];
  return Array.from({ length: frameCount }, (_, index) => {
    return Math.min(maxTimestamp, (maxTimestamp * index) / (frameCount - 1));
  });
}

function getKeyframeName(pfx: string, index: number): string {
  return `${pfx}kf_${index}.png`;
}

async function cleanupKeyframes(ffmpeg: FFmpegAPI, pfx: string, count: number): Promise<void> {
  for (let i = 1; i <= count; i++) {
    await ffmpeg.deleteFile(getKeyframeName(pfx, i)).catch(() => {});
  }
}

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'mov') return '.mov';
  if (ext === 'webm') return '.webm';
  return '.mp4';
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => { resolve(10); URL.revokeObjectURL(url); };
    video.src = url;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
