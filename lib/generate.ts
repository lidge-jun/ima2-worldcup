const OAUTH_PROXY = 'http://127.0.0.1:10531';
const OPENAI_API = 'https://api.openai.com';

export type AuthMode = 'proxy' | 'apikey';

export async function detectAuthMode(): Promise<{ mode: AuthMode; available: boolean }> {
  try {
    const res = await fetch(`${OAUTH_PROXY}/v1/models`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) return { mode: 'proxy', available: true };
  } catch {}
  return { mode: 'apikey', available: false };
}

export async function generateImage(
  imageB64: string,
  prompt: string,
  token: string,
  authMode: AuthMode = 'proxy',
): Promise<string> {
  const mime = imageB64.startsWith('/9j/') ? 'image/jpeg'
    : imageB64.startsWith('iVBOR') ? 'image/png'
    : 'image/webp';

  const baseUrl = authMode === 'proxy' ? OAUTH_PROXY : OPENAI_API;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
  if (authMode === 'apikey' && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/v1/responses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_image', image_url: `data:${mime};base64,${imageB64}` },
            { type: 'input_text', text: prompt },
          ],
        },
      ],
      tools: [{ type: 'image_generation', quality: 'low', size: '1024x1024' }],
      tool_choice: { type: 'image_generation' },
      reasoning: { effort: 'low' },
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `OpenAI error ${res.status}`;
    try { msg = JSON.parse(text)?.error?.message || msg; } catch {}
    throw new Error(msg);
  }

  return parseSSEForImage(res);
}

async function parseSSEForImage(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let resultB64 = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;

      try {
        const event = JSON.parse(payload);

        if (event.type === 'response.output_item.done' &&
            event.item?.type === 'image_generation_call' &&
            event.item?.result) {
          resultB64 = event.item.result;
        }

        if (event.type === 'response.completed' &&
            event.response?.output) {
          for (const item of event.response.output) {
            if (item.type === 'image_generation_call' && item.result) {
              resultB64 = item.result;
            }
          }
        }
      } catch {}
    }
  }

  if (!resultB64) throw new Error('No image in SSE stream');
  return resultB64;
}
