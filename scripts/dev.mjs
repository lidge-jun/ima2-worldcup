#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.PORT || 3477;
const OAUTH_PORT = process.env.OAUTH_PORT || 10531;

const procs = [];

function start(name, cmd, args, env = {}) {
  const p = spawn(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  p._name = name;
  procs.push(p);
  p.on("exit", (code) => {
    if (name === "next") cleanup(code ?? 1);
  });
  return p;
}

function cleanup(code = 0) {
  for (const p of procs) {
    try { p.kill(); } catch {}
  }
  process.exit(code);
}

process.on("SIGINT", () => cleanup(0));
process.on("SIGTERM", () => cleanup(0));

console.log(`[dev] starting Next.js on :${PORT} + openai-oauth proxy on :${OAUTH_PORT}`);

start("oauth", "npx", ["openai-oauth", "--port", String(OAUTH_PORT)]);
start("next", "npx", ["next", "dev", "--port", String(PORT)]);
