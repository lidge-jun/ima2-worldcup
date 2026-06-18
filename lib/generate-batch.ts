import type { Frame, StyledFrame } from './ffmpeg/types';
import { getStylePrompt } from './styles';

const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 2000;

export async function generateBatch(
  frames: Frame[],
  style: string,
  customPrompt: string,
  token: string,
  onProgress: (done: number, total: number, frameIndex: number) => void,
): Promise<StyledFrame[]> {
  const prompt = getStylePrompt(style, customPrompt);
  const results: StyledFrame[] = frames.map(f => ({ ...f, status: 'pending' as const }));
  let completed = 0;
  let running = 0;
  let nextIndex = 0;

  return new Promise(resolve => {
    function tryNext() {
      while (running < MAX_CONCURRENT && nextIndex < frames.length) {
        const idx = nextIndex++;
        running++;
        processFrame(idx);
      }
      if (completed === frames.length) {
        resolve(results);
      }
    }

    async function processFrame(idx: number, retryCount = 0) {
      results[idx].status = 'active';
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageB64: frames[idx].b64,
            style,
            customPrompt,
            token,
          }),
        });

        if ((res.status === 429 || res.status >= 500) && retryCount < MAX_RETRIES) {
          const delay = RETRY_BASE_MS * Math.pow(2, retryCount);
          await sleep(delay);
          return processFrame(idx, retryCount + 1);
        }

        const data = await res.json();
        if (!res.ok || data.error) {
          results[idx].status = 'error';
          results[idx].error = data.error || `HTTP ${res.status}`;
        } else {
          results[idx].styledB64 = data.resultB64;
          results[idx].status = 'done';
        }
      } catch (err) {
        results[idx].status = 'error';
        results[idx].error = err instanceof Error ? err.message : 'Network error';
      }

      completed++;
      running--;
      onProgress(completed, frames.length, idx);
      tryNext();
    }

    tryNext();
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
