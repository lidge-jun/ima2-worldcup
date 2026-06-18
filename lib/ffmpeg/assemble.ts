import { getFFmpeg } from './worker';

export async function assembleVideo(styledBlobs: Blob[], fps: number, jobId = ''): Promise<Blob> {
  const pfx = jobId ? `${jobId}_` : '';
  const ffmpeg = await getFFmpeg();
  await writeFrames(ffmpeg, styledBlobs, pfx);

  const outName = `${pfx}output.mp4`;
  await ffmpeg.exec([
    '-f', 'image2',
    '-framerate', String(fps),
    '-i', `${pfx}styled_%04d.png`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    outName,
  ]);

  const data = await ffmpeg.readFile(outName) as Uint8Array;
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'video/mp4' });

  await cleanupFrames(ffmpeg, styledBlobs.length, pfx);
  await ffmpeg.deleteFile(outName);
  return blob;
}

export async function assembleGif(styledBlobs: Blob[], fps: number, jobId = ''): Promise<Blob> {
  const pfx = jobId ? `${jobId}_` : '';
  const ffmpeg = await getFFmpeg();
  await writeFrames(ffmpeg, styledBlobs, pfx);

  const paletteName = `${pfx}palette.png`;
  const outName = `${pfx}output.gif`;

  await ffmpeg.exec([
    '-f', 'image2',
    '-framerate', String(fps),
    '-i', `${pfx}styled_%04d.png`,
    '-vf', 'palettegen',
    '-y', paletteName,
  ]);

  await ffmpeg.exec([
    '-f', 'image2',
    '-framerate', String(fps),
    '-i', `${pfx}styled_%04d.png`,
    '-i', paletteName,
    '-lavfi', 'paletteuse',
    '-loop', '0',
    outName,
  ]);

  const data = await ffmpeg.readFile(outName) as Uint8Array;
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/gif' });

  await cleanupFrames(ffmpeg, styledBlobs.length, pfx);
  await ffmpeg.deleteFile(paletteName).catch(() => {});
  await ffmpeg.deleteFile(outName);
  return blob;
}

async function writeFrames(ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>, blobs: Blob[], pfx: string) {
  for (let i = 0; i < blobs.length; i++) {
    const name = `${pfx}styled_${String(i + 1).padStart(4, '0')}.png`;
    await ffmpeg.writeFile(name, new Uint8Array(await blobs[i].arrayBuffer()));
  }
}

async function cleanupFrames(ffmpeg: Awaited<ReturnType<typeof getFFmpeg>>, count: number, pfx: string) {
  for (let i = 0; i < count; i++) {
    await ffmpeg.deleteFile(`${pfx}styled_${String(i + 1).padStart(4, '0')}.png`);
  }
}
