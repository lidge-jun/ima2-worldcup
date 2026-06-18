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
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = `OpenAI error ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      msg = parsed?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  const output = data?.output;
  if (!Array.isArray(output)) throw new Error('Unexpected response shape');

  for (const item of output) {
    if (item.type === 'image_generation_call' && item.result) {
      return item.result;
    }
  }

  throw new Error('No image in response');
}
