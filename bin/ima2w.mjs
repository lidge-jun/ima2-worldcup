#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, cpSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VERSION = JSON.parse(
  (await import('node:fs')).readFileSync(join(ROOT, 'package.json'), 'utf8')
).version;

const args = process.argv.slice(2);
const cmd = args[0] || 'serve';

if (cmd === '--help' || cmd === '-h') {
  console.log(`ima2w v${VERSION} — AI fan art style transfer

Commands:
  serve [--port N]   Start the app (default: 3477)
  --version, -v      Show version
  --help, -h         Show this help`);
  process.exit(0);
}

if (cmd === '--version' || cmd === '-v') {
  console.log(VERSION);
  process.exit(0);
}

if (cmd === 'serve') {
  const portIdx = args.indexOf('--port');
  const port = portIdx >= 0 ? args[portIdx + 1] : '3477';
  const oauthPort = '10531';

  const standalonePath = join(ROOT, '.next', 'standalone', 'server.js');
  const useStandalone = existsSync(standalonePath);

  if (useStandalone) {
    // Copy static assets if missing (B1 fix)
    const standaloneRoot = join(ROOT, '.next', 'standalone');
    const staticSrc = join(ROOT, '.next', 'static');
    const staticDest = join(standaloneRoot, '.next', 'static');
    const publicSrc = join(ROOT, 'public');
    const publicDest = join(standaloneRoot, 'public');

    if (existsSync(staticSrc) && !existsSync(staticDest)) {
      cpSync(staticSrc, staticDest, { recursive: true });
    }
    if (existsSync(publicSrc) && !existsSync(publicDest)) {
      cpSync(publicSrc, publicDest, { recursive: true });
    }
  }

  const procs = [];

  function cleanup(code = 0) {
    for (const p of procs) { try { p.kill(); } catch {} }
    process.exit(code);
  }
  process.on('SIGINT', () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));

  // Try starting openai-oauth proxy (graceful degradation — B2 fix)
  let proxyAvailable = false;
  try {
    const which = execSync('which openai-oauth 2>/dev/null || npx --yes openai-oauth --version 2>/dev/null', { timeout: 5000, stdio: 'pipe' });
    proxyAvailable = true;
  } catch {}

  if (proxyAvailable) {
    const proxy = spawn('npx', ['openai-oauth', '--port', oauthPort], {
      cwd: ROOT, stdio: 'inherit',
      env: { ...process.env },
    });
    procs.push(proxy);
  } else {
    console.log('[ima2w] openai-oauth not found — running in API key mode only');
    console.log('[ima2w] To enable proxy mode: npm i -g openai-oauth && codex auth');
  }

  // Start Next.js
  if (useStandalone) {
    const server = spawn(process.execPath, [standalonePath], {
      cwd: join(ROOT, '.next', 'standalone'),
      stdio: 'inherit',
      env: { ...process.env, PORT: port, HOSTNAME: '0.0.0.0' },
    });
    procs.push(server);
    server.on('exit', (code) => cleanup(code ?? 1));
  } else {
    const server = spawn('npx', ['next', 'dev', '--port', port], {
      cwd: ROOT, stdio: 'inherit',
      env: { ...process.env },
    });
    procs.push(server);
    server.on('exit', (code) => cleanup(code ?? 1));
  }

  console.log(`[ima2w] starting on http://localhost:${port}`);

  // Auto-open browser after 2s
  setTimeout(async () => {
    try {
      const { exec } = await import('node:child_process');
      const url = `http://localhost:${port}`;
      if (process.platform === 'darwin') exec(`open ${url}`);
      else if (process.platform === 'linux') exec(`xdg-open ${url}`);
      else if (process.platform === 'win32') exec(`start ${url}`);
    } catch {}
  }, 2000);
} else {
  console.error(`Unknown command: ${cmd}. Run 'ima2w --help' for usage.`);
  process.exit(1);
}
