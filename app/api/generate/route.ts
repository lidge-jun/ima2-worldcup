import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/generate';
import { getStylePrompt } from '@/lib/styles';

export async function POST(req: NextRequest) {
  try {
    const { imageB64, style, customPrompt, token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token required' }, { status: 401 });
    }
    if (!imageB64 || typeof imageB64 !== 'string') {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    const prompt = getStylePrompt(style, customPrompt);
    const resultB64 = await generateImage(imageB64, prompt, token);

    return NextResponse.json({ resultB64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    const status = message.includes('401') || message.includes('403') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
