const CODEX_KEY = 'ima2wc_codex_token';
const GROK_KEY = 'ima2wc_grok_token';

export function getCodexToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CODEX_KEY) || '';
}

export function saveCodexToken(token: string): void {
  localStorage.setItem(CODEX_KEY, token);
}

export function getGrokToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(GROK_KEY) || '';
}

export function saveGrokToken(token: string): void {
  localStorage.setItem(GROK_KEY, token);
}

export function clearTokens(): void {
  localStorage.removeItem(CODEX_KEY);
  localStorage.removeItem(GROK_KEY);
}
