import { NextRequest, NextResponse } from 'next/server';
import { generateImage, detectAuthMode } from '@/lib/generate';
import { getStylePrompt } from '@/lib/styles';

export async function POST(req: NextRequest) {
  try {
    const { imageB64, style, customPrompt, token } = await req.json();

    if (!imageB64 || typeof imageB64 !== 'string') {
      return NextResponse.json({ error: 'Image required' }, { status: 400 });
    }

    const { mode: authMode, available } = await detectAuthMode();

    if (authMode === 'apikey' && (!token || typeof token !== 'string')) {
      return NextResponse.json({ error: 'No openai-oauth proxy found and no API key provided. Run: npx openai-oauth --port 10531' }, { status: 401 });
    }

    const prompt = getStylePrompt(style, customPrompt);
    const resultB64 = await generateImage(imageB64, prompt, token || '', authMode);

    return NextResponse.json({ resultB64, authMode });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    const status = message.includes('401') || message.includes('403') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
