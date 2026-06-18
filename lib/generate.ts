export async function generateImage(imageB64: string, prompt: string, token: string): Promise<string> {
  const mime = imageB64.startsWith('/9j/') ? 'image/jpeg'
    : imageB64.startsWith('iVBOR') ? 'image/png'
    : 'image/webp';

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
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
