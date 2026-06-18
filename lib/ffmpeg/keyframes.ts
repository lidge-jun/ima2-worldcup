import { getFFmpeg } from './worker';
import type { Frame } from './types';

export async function extractKeyframes(file: File, count = 5, jobId = ''): Promise<Frame[]> {
  const pfx = jobId ? `${jobId}_` : '';
  const ffmpeg = await getFFmpeg();

  const inputName = `${pfx}kf_input${getExtension(file.name)}`;
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

  const duration = await getVideoDuration(file);
  const interval = duration / (count + 1);

  const frames: Frame[] = [];
  for (let i = 1; i <= count; i++) {
    const timestamp = interval * i;
    const outName = `${pfx}kf_${i}.png`;
    await ffmpeg.exec([
      '-ss', String(timestamp),
      '-i', inputName,
      '-frames:v', '1',
      '-vf', `scale='min(1024,iw)':'-1':flags=lanczos`,
      '-f', 'image2',
      outName,
    ]);

    try {
      const data = await ffmpeg.readFile(outName) as Uint8Array;
      const blob = new Blob([(data.buffer as ArrayBuffer).slice(data.byteOffset, data.byteOffset + data.byteLength)], { type: 'image/png' });
      const b64 = await blobToBase64(blob);
      frames.push({ index: i - 1, timestamp, blob, b64 });
      await ffmpeg.deleteFile(outName);
    } catch {}
  }

  await ffmpeg.deleteFile(inputName);
  return frames;
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
