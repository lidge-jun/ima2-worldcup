import { getFFmpeg } from './worker';

export async function assembleGif(styledBlobs: Blob[], fps: number): Promise<Blob> {
  const ffmpeg = await getFFmpeg();

  for (let i = 0; i < styledBlobs.length; i++) {
    const name = `styled_${String(i + 1).padStart(4, '0')}.png`;
    const buf = new Uint8Array(await styledBlobs[i].arrayBuffer());
    await ffmpeg.writeFile(name, buf);
  }

  await ffmpeg.exec([
    '-f', 'image2',
    '-framerate', String(fps),
    '-i', 'styled_%04d.png',
    '-vf', 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
    'output.gif',
  ]);

  const data = await ffmpeg.readFile('output.gif') as Uint8Array;
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'image/gif' });

  for (let i = 0; i < styledBlobs.length; i++) {
    await ffmpeg.deleteFile(`styled_${String(i + 1).padStart(4, '0')}.png`);
  }
  await ffmpeg.deleteFile('output.gif');

  return blob;
}
