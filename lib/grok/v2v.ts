import { getStylePrompt } from '../styles';

const XAI_BASE = 'https://api.x.ai/v1';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 300000;

export type V2VProgress = 'uploading' | 'processing' | 'downloading' | 'done' | 'error';

export async function grokVideoToVideo(
  videoFile: File,
  style: string,
  customPrompt: string,
  grokToken: string,
  onProgress?: (stage: V2VProgress, message?: string) => void,
): Promise<string> {
  const prompt = getStylePrompt(style, customPrompt);

  onProgress?.('uploading', 'Uploading video to Grok...');

  const formData = new FormData();
  formData.append('file', videoFile);
  formData.append('prompt', prompt);
  formData.append('model', 'grok-2-video');

  const res = await fetch(`${XAI_BASE}/video/generations`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${grokToken}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Grok API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();

  if (data.url) {
    onProgress?.('downloading', 'Downloading result...');
    return data.url;
  }

  if (data.id) {
    onProgress?.('processing', 'Grok is processing your video...');
    return pollForResult(data.id, grokToken, onProgress);
  }

  throw new Error('Unexpected Grok response format');
}

async function pollForResult(
  jobId: string,
  token: string,
  onProgress?: (stage: V2VProgress, message?: string) => void,
): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    const res = await fetch(`${XAI_BASE}/video/generations/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) continue;

    const data = await res.json();

    if (data.status === 'completed' && data.url) {
      onProgress?.('downloading', 'Downloading result...');
      return data.url;
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Grok video generation failed');
    }

    onProgress?.('processing', `Processing... ${data.progress ? Math.round(data.progress * 100) + '%' : ''}`);
  }

  throw new Error('Grok generation timed out (5 min)');
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
