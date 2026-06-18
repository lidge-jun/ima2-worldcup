import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ valid: false, error: 'Token required' });
    }

    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (res.ok) {
      return NextResponse.json({ valid: true });
    }
    return NextResponse.json({ valid: false, error: `Invalid token (${res.status})` });
  } catch {
    return NextResponse.json({ valid: false, error: 'Validation request failed' });
  }
}
