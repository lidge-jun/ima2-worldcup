import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './worker';
import type { Frame } from './types';

export async function extractFrames(file: File, fps: number): Promise<Frame[]> {
  const ffmpeg = await getFFmpeg();

  const inputName = 'input' + getExtension(file.name);
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  await ffmpeg.exec([
    '-i', inputName,
    '-vf', `fps=${fps}`,
    '-f', 'image2',
    'frame_%04d.png',
  ]);

  const frames: Frame[] = [];
  for (let i = 1; ; i++) {
    const name = `frame_${String(i).padStart(4, '0')}.png`;
    try {
      const data = await ffmpeg.readFile(name) as Uint8Array;
      const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/png' });
      const b64 = await blobToBase64(blob);
      frames.push({
        index: i - 1,
        timestamp: (i - 1) / fps,
        blob,
        b64,
      });
      await ffmpeg.deleteFile(name);
    } catch {
      break;
    }
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
