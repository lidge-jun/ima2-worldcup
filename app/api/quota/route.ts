import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface QuotaWindow { label: string; percent: number; resetsAt: string | null; }
interface QuotaResult {
  provider: string;
  account?: { email: string | null; plan: string | null } | null;
  windows: QuotaWindow[];
  authenticated?: boolean;
  billing?: { usedUsd: number; limitUsd: number };
}

function readCodexTokens(): { access_token: string; account_id: string } | null {
  const codexHome = process.env.CODEX_HOME || join(homedir(), '.codex');
  try {
    const j = JSON.parse(readFileSync(join(codexHome, 'auth.json'), 'utf8'));
    if (j?.tokens?.access_token) {
      return { access_token: j.tokens.access_token, account_id: j.tokens.account_id ?? '' };
    }
  } catch {}
  return null;
}

async function fetchCodexUsage(tokens: { access_token: string; account_id: string }): Promise<QuotaResult> {
  try {
    const resp = await fetch('https://chatgpt.com/backend-api/wham/usage', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'ChatGPT-Account-Id': tokens.account_id,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) return { provider: 'codex', authenticated: false, windows: [] };
      return { provider: 'codex', windows: [] };
    }
    const data = await resp.json() as {
      email?: string | null;
      plan_type?: string | null;
      rate_limit?: {
        primary_window?: { used_percent?: number; reset_at?: number };
        secondary_window?: { used_percent?: number; reset_at?: number };
      };
    };
    const windows: QuotaWindow[] = [];
    if (data.rate_limit?.primary_window) {
      windows.push({
        label: '5h',
        percent: Math.round(data.rate_limit.primary_window.used_percent ?? 0),
        resetsAt: data.rate_limit.primary_window.reset_at
          ? new Date(data.rate_limit.primary_window.reset_at * 1000).toISOString()
          : null,
      });
    }
    if (data.rate_limit?.secondary_window) {
      windows.push({
        label: '7d',
        percent: Math.round(data.rate_limit.secondary_window.used_percent ?? 0),
        resetsAt: data.rate_limit.secondary_window.reset_at
          ? new Date(data.rate_limit.secondary_window.reset_at * 1000).toISOString()
          : null,
      });
    }
    return {
      provider: 'codex',
      account: { email: data.email ?? null, plan: data.plan_type ?? null },
      windows,
    };
  } catch {
    return { provider: 'codex', windows: [] };
  }
}

async function fetchGrokBilling(): Promise<QuotaResult> {
  try {
    const authPath = join(homedir(), '.progrok', 'auth.json');
    if (!existsSync(authPath)) return { provider: 'grok', authenticated: false, windows: [] };
    const auth = JSON.parse(readFileSync(authPath, 'utf8')) as { accessToken?: string };
    if (!auth.accessToken) return { provider: 'grok', authenticated: false, windows: [] };

    const headers = { Authorization: `Bearer ${auth.accessToken}` };
    const [billingRes, userRes] = await Promise.allSettled([
      fetch('https://cli-chat-proxy.grok.com/v1/billing', { headers, signal: AbortSignal.timeout(8000) }),
      fetch('https://cli-chat-proxy.grok.com/v1/user', { headers, signal: AbortSignal.timeout(5000) }),
    ]);
    if (billingRes.status !== 'fulfilled' || !billingRes.value.ok) {
      return { provider: 'grok', authenticated: true, windows: [] };
    }
    const billing = (await billingRes.value.json() as {
      config: { monthlyLimit: { val: number }; used: { val: number }; billingPeriodEnd: string };
    }).config;
    const limit = billing.monthlyLimit.val;
    const used = billing.used.val;
    let email: string | null = null;
    if (userRes.status === 'fulfilled' && userRes.value.ok) {
      const user = await userRes.value.json() as { email?: string };
      email = user.email ?? null;
    }
    const tier = limit >= 150000 ? 'SuperGrok Heavy' : limit >= 15000 ? 'SuperGrok' : `SuperGrok (${limit} val)`;
    return {
      provider: 'grok',
      account: { email, plan: tier },
      windows: [{
        label: 'monthly',
        percent: limit > 0 ? Math.round((used / limit) * 100) : 0,
        resetsAt: billing.billingPeriodEnd,
      }],
      billing: { usedUsd: used / 100, limitUsd: limit / 100 },
    };
  } catch {
    return { provider: 'grok', windows: [] };
  }
}

export async function GET() {
  const tokens = readCodexTokens();
  const [codex, grok] = await Promise.allSettled([
    tokens ? fetchCodexUsage(tokens) : Promise.resolve({ provider: 'codex', authenticated: false, windows: [] } as QuotaResult),
    fetchGrokBilling(),
  ]);

  return NextResponse.json({
    codex: codex.status === 'fulfilled' ? codex.value : { provider: 'codex', windows: [] },
    grok: grok.status === 'fulfilled' ? grok.value : { provider: 'grok', windows: [] },
  });
}
