import { NextResponse } from 'next/server';

const OAUTH_PROXY = 'http://127.0.0.1:10531';

export async function GET() {
  const result: { proxyAvailable: boolean; authMode: 'proxy' | 'apikey' | 'none'; models?: string[] } = {
    proxyAvailable: false,
    authMode: 'none',
  };

  // Skip proxy check on Vercel — proxy is local-only
  if (process.env.VERCEL) {
    result.authMode = 'apikey';
    return NextResponse.json(result);
  }

  try {
    const res = await fetch(`${OAUTH_PROXY}/v1/models`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      result.proxyAvailable = true;
      result.authMode = 'proxy';
      result.models = data?.data?.map((m: { id: string }) => m.id) || [];
    }
  } catch {}

  return NextResponse.json(result);
}
