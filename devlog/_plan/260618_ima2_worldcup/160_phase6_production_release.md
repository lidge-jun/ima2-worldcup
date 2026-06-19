# 160 — Phase 6: Production Release Readiness (PABCD)

## P — Plan

### Part 1 (plain)
Get ima2-worldcup ready to ship as a polished **v1.0.0**. Make the README accurate and
helpful (fix the wrong mode name, state what you need to run it, add a real screenshot),
hide the internal `/qa` test page from production so end users never see it, fill in the
missing package `author` and bump the version, then prove everything still builds and the
`ima2w` command launches. **No actual `npm publish`** — production-ready, not published.

### Part 2 (diff-precise)

**B1 — `README.md` (MODIFY)**
- Modes table: `Frames→Video` → `Frames→MP4` (match the app's `ModeSelector` label).
- Add **Requirements**: Node ≥20; a Chromium/Firefox/Safari with SharedArrayBuffer
  (COOP/COEP already set); for real generation either the local `openai-oauth` proxy
  (Codex OAuth) on `:10531` or an OpenAI API key via the Connect button.
- Add **Usage** notes: how each mode is driven (upload → mode → style → Generate →
  preview/Download), and where the token/Connect lives.
- Embed a real screenshot near the top: `![ima2-worldcup](docs/screenshot.png)`.
- Keep tech-stack/architecture sections; verify wording matches reality (gpt-5.4-mini).

**B2 — `app/qa/page.tsx` (MODIFY)** — gate the dev harness out of production
- `import { notFound } from 'next/navigation';`
- First line of the component body: `if (process.env.NODE_ENV === 'production') notFound();`
- Result: `/qa` returns 404 in the standalone/production build; still works under
  `npm run dev`. `NODE_ENV` is build-inlined, so the gate is deterministic per build
  (no React hooks-order risk).

**B3 — `package.json` (MODIFY)** — complete metadata
- Add `"author": "lidge-jun"` (matches LICENSE holder).
- `"version": "0.1.0"` → `"1.0.0"`.
- Keep `description` aligned with the README lead sentence.
- **Sync `package-lock.json`** version (root `version` + `packages[""].version`, both `0.1.0`)
  to `1.0.0` so the lockfile matches (audit catch).

### A — Audit result (focused self-audit, C2–C3 depth)
- PASS. README drift is exactly line 10 `**Frames→Video**`; line 11 already `Video→1pic`.
- `docs/` absent (create). Standalone app live on :3490 → screenshot capture viable.
- `next/navigation` `notFound` is the correct Next 16 import (a bare-Node `import()` probe
  failed only on package-exports resolution; tsc/build is the real check).
- Build-safety note: a client component calling `notFound()` during production prerender
  yields a static 404 for `/qa` (supported); C must confirm `npm run build` exit 0 AND
  `/qa` → 404. Fallback if it ever fails the build: render an inline "not available"
  view instead of `notFound()`.
- New catch folded in: also bump `package-lock.json`.

**B4 — `docs/screenshot.png` (NEW)**
- Capture the running standalone app (neobrutalism UI: upload + modes + gallery/preview).
- Placed in `docs/` and intentionally NOT added to npm `files`, so it renders on GitHub
  without bloating the published tarball.

### C — Check
- `npx tsc --noEmit` → exit 0.
- `npm run build` → exit 0; in the standalone build confirm `/qa` returns 404 and `/` 200.
- `npm pack --dry-run` → contents sane, no unexpected files; total size noted.
- CLI smoke: `node bin/ima2w.mjs --help`, `--version` (shows `1.0.0`), and `ima2w serve`
  launches and serves 200, then stop.
- README spot-check: mode name fixed, screenshot reference present and resolvable.

### D — Record + commit
- This doc (`160_phase6_production_release.md`) carries plan + evidence.
- Atomic commits: README, /qa gate, package metadata, screenshot, devlog.

### C — Verification evidence
- `npx tsc --noEmit --incremental false`: exit 0.
- `npm run build`: exit 0; postbuild copied static+public; banner shows `ima2-worldcup@1.0.0`.
- Runtime (standalone `PORT=3490`): `/` = 200, `/qa` = **404**, `/api/health` = 200.
- Dev (`next dev` :3477): `/qa` = **200** — harness still available under `npm run dev`.
- `npm pack --dry-run`: `version: 1.0.0`, `ima2-worldcup-1.0.0.tgz`, 26.8 MB / 1439 files;
  `docs/screenshot` occurrences in tarball = **0** (screenshot renders on GitHub, not shipped).
- CLI: `ima2w --version` → `1.0.0`; `ima2w --help` → `ima2w v1.0.0`; `ima2w serve --port 3492`
  ready in 2s, `/` = 200, `/qa` = 404, graceful "API key mode only" when no global proxy.
- README: `docs/screenshot.png` exists (2560×1266, 504 KB) and is referenced.

### D — Outcome
Production-ready at v1.0.0. Commits (atomic): README+screenshot, /qa dev-gate, release
metadata, this devlog. No `npm publish`, no push (left for the user).

### Scope / risk
- Work class C2–C3; the **release surface** (npm pack, version) gets C4-level verification
  care. No irreversible action: **no `npm publish`**, no push.
- Decisions made autonomously (goal mode): `author=lidge-jun` (from LICENSE), version
  `1.0.0` (production signal). Both trivially reversible.
- Files touched: `README.md`, `app/qa/page.tsx`, `package.json`, `docs/screenshot.png` (new),
  this devlog (new). Existing `devlog/` reused; no new top-level source-of-truth folders.
