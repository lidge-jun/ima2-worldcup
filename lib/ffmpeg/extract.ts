import { getFFmpeg } from './worker';
import type { Frame } from './types';

export async function extractFrames(file: File, fps: number, jobId = ''): Promise<Frame[]> {
  const pfx = jobId ? `${jobId}_` : '';
  console.log(`[extract] start: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) @ ${fps}fps [${pfx || 'default'}]`);
  const ffmpeg = await getFFmpeg();

  const inputName = `${pfx}input${getExtension(file.name)}`;
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

  const exitCode = await ffmpeg.exec([
    '-i', inputName,
    '-vf', `fps=${fps},scale='min(1024,iw)':'-1':flags=lanczos`,
    '-f', 'image2',
    `${pfx}frame_%04d.png`,
  ]);
  console.log('[extract] ffmpeg exit code:', exitCode);

  const frames: Frame[] = [];
  for (let i = 1; ; i++) {
    const name = `${pfx}frame_${String(i).padStart(4, '0')}.png`;
    try {
      const data = await ffmpeg.readFile(name) as Uint8Array;
      const blob = new Blob([(data.buffer as ArrayBuffer).slice(data.byteOffset, data.byteOffset + data.byteLength)], { type: 'image/png' });
      const b64 = await blobToBase64(blob);
      frames.push({ index: i - 1, timestamp: (i - 1) / fps, blob, b64 });
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
