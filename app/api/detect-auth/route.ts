import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export async function GET() {
  const result: { codexToken?: string; grokToken?: string } = {};

  const codexPaths = [
    join(process.env.CODEX_HOME || join(homedir(), '.codex'), 'auth.json'),
    join(homedir(), '.chatgpt-local', 'auth.json'),
    join(homedir(), '.config', 'codex', 'auth.json'),
  ];

  for (const p of codexPaths) {
    if (!existsSync(p)) continue;
    try {
      const data = JSON.parse(readFileSync(p, 'utf-8'));
      const token = data?.tokens?.access_token;
      if (token && typeof token === 'string') {
        result.codexToken = token;
        break;
      }
    } catch {}
  }

  return NextResponse.json(result);
}
