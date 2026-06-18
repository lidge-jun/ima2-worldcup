import { getFFmpeg } from './worker';

export async function assembleVideo(styledBlobs: Blob[], fps: number): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  await writeFrames(ffmpeg, styledBlobs);

  await ffmpeg.exec([
    '-f', 'image2',
    '-framerate', String(fps),
    '-i', 'styled_%04d.png',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    'output.mp4',
  ]);

  const data = await ffmpeg.readFile('output.mp4') as Uint8Array;
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });

  await cleanupFrames(ffmpeg, styledBlobs.length);
  await ffmpeg.deleteFile('output.mp4');
  return blob;
}

export async function assembleGif(styledBlobs: Blob[], fps: number): Promise<Blob> {
  const ffmpeg = await getFFmpeg();
  await writeFrames(ffmpeg, styledBlobs);

  // Two-pass: generate palette first, then apply it (single-pass split filter fails in wasm)
  await ffmpeg.exec([
    '-f', 'image2',
    '-framerate', String(fps),
    '-i', 'styled_%04d.png',
    '-vf', 'palettegen',
    '-y', 'palette.png',
  ]);

  await ffmpeg.exec([
    '-f', 'image2',
    '-framerate', String(fps),
    '-i', 'styled_%04d.png',
    '-i', 'palette.png',
    '-lavfi', 'paletteuse',
    '-loop', '0',
    'output.gif',
  ]);

  const data = await ffmpeg.readFile('output.gif') as Uint8Array;
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/gif' });

  await cleanupFrames(ffmpeg, styledBlobs.length);
  await ffmpeg.deleteFile('palette.png').catch(() => {});
  await ffmpeg.deleteFile('output.gif');
  return blob;
}

async function writeFrames(ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>, blobs: Blob[]) {
  for (let i = 0; i < blobs.length; i++) {
    const name = `styled_${String(i + 1).padStart(4, '0')}.png`;
    await ffmpeg.writeFile(name, new Uint8Array(await blobs[i].arrayBuffer()));
  }
}

async function cleanupFrames(ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>, count: number) {
  for (let i = 0; i < count; i++) {
    await ffmpeg.deleteFile(`styled_${String(i + 1).padStart(4, '0')}.png`);
  }
}
