import { runWithFFmpeg, type FFmpegAPI } from './worker';

export async function assembleVideo(styledBlobs: Blob[], fps: number, jobId = ''): Promise<Blob> {
  const pfx = jobId ? `${jobId}_` : '';
  return runWithFFmpeg(async (ffmpeg) => {
    const outName = `${pfx}output.mp4`;

    try {
      await writeFrames(ffmpeg, styledBlobs, pfx);
      const exitCode = await ffmpeg.exec([
        '-f', 'image2',
        '-framerate', String(fps),
        '-i', `${pfx}styled_%04d.png`,
        '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
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
  return runWithFFmpeg(async (ffmpeg) => {
    const paletteName = `${pfx}palette.png`;
    const outName = `${pfx}output.gif`;

    try {
      await writeFrames(ffmpeg, styledBlobs, pfx);

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
      const gifCopy = new ArrayBuffer(data.byteLength);
      new Uint8Array(gifCopy).set(data);
      return new Blob([gifCopy], { type: 'image/gif' });
    } finally {
      await cleanupFrames(ffmpeg, styledBlobs.length, pfx);
      await ffmpeg.deleteFile(paletteName).catch(() => {});
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
