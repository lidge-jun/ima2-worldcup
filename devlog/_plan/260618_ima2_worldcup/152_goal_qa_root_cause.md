# 152 — Goal QA: Actual Root Cause of Recurring MP4 Failure

## Why this follows 151
Doc 151 recorded fixes (even-dimension padding, transaction serialization, canceled-job
guarding) and claimed the flows passed. The user reported it **still did not work**
("계속 안되는데"). 151's QA used fixtures that happened to be *uniform* (a single tiny
MP4 fixture, single-frame paths), so it never exercised the real failing case and the
true root cause survived.

## Real Root Cause (found via deterministic reproduction)
A new in-browser harness (`/qa`) fed `assembleVideo` four frames at **different odd
dimensions** (1681×935, 1671×941, 1280×721, 1024×1024) — the shape real AI-styled frames
actually take. Console showed `[ffmpeg] Aborted()` during libx264 encoding.

Two independent root causes:
1. **Non-uniform frame dimensions.** The old filter `pad=ceil(iw/2)*2:ceil(ih/2)*2` made
   each frame *even* but not *uniform*. libx264 aborts the instant input dimensions change
   mid-stream → zero-byte/failed MP4, while the UI could still reach a download-looking
   state. `assembleGif`'s two-file palette flow had no exit-code check and silently
   returned an empty GIF.
2. **No worker recovery.** A wasm abort permanently poisons the single ffmpeg-core
   instance. The crashed worker was reused, so every later call hung forever — one bad
   encode bricked all subsequent jobs until a full page reload. This is why failures
   "kept happening" across attempts.

## Fixes
- `lib/ffmpeg/assemble.ts` (`686a2de`): scale+pad every frame onto one identical even
  canvas (aspect preserved, capped 1280, `setsar=1`) for MP4 and GIF; GIF rewritten to a
  single-pass `split→palettegen→paletteuse` graph with exit-code + empty-output checks.
- `lib/ffmpeg/worker.ts` (`62ace88`): exec watchdog timeout, `onerror`/`onmessageerror`
  handlers, and reset-on-thrown-exec; any tears down the worker and clears the singleton
  so the next `runWithFFmpeg()` rebuilds a clean instance instead of hanging.
- `app/qa/page.tsx` (`fd847a8`): permanent in-browser regression harness.

## Verification Evidence
Run against the production **standalone** build (`PORT=3490 node .next/standalone/server.js`),
not dev — Next dev's HMR socket cannot survive CDP control and reload-loops the harness.

- `npx tsc --noEmit --incremental false`: exit 0. `npm run build`: exit 0, standalone
  static/public copied.
- Deterministic `/qa` suite — **5/5 pass** offline:
  - assembleVideo varying odd dims → playable MP4 `26733B 1280×712 2.00s` (was: Aborted).
  - assembleVideo single odd frame → `3790B 998×554 1.00s`.
  - assembleGif varying odd dims → `17610B` (was: 0 bytes).
  - extractFrames MP4 round-trip → 4 frames. extractKeyframes → 4 keyframes.
- `/qa?live=1` opt-in integration — **pass**: real `/api/generate` (proxy) ×2 →
  assembleVideo → `1246515B 1254×1254 2.00s`.
- Real UI end-to-end on the actual app (clip injected via DataTransfer):
  - **Frames→MP4**: upload → real AI gen → `complete`, `<video>` readyState 4, duration 2s,
    `Download MP4`, gallery 0→1. Preview/download source blob = **858025 bytes 1280×724**
    (the previous session's `~/Downloads/ima2wc-crayon.mp4` was 0 bytes — the reported bug).
  - **Video→1pic**: keyframe → real AI gen → `complete`, preview shows the generated
    result image (~3.5 MB data URL), `Download`.
  - **Gallery replay**: after reload, clicking the stored item restored a playable MP4
    (readyState 4, 1280px, `Download MP4`) from IndexedDB.
- Standalone launch readiness: `/` and `/qa` 200; COOP/COEP headers present;
  `/api/detect-auth` reports `proxyAvailable:true` (gpt-5.4-mini).

## Residual Notes
- Programmatic blob downloads do not persist to disk under CDP automation (a trivial
  control anchor-download also did not write); the download *source* blob is verified
  non-zero, and the handler uses the standard anchor-click pattern, so a real browser
  saves the file.
- `extractKeyframes` logs a benign `image2` pattern warning and skips an end-of-stream
  timestamp on very short clips; non-fatal — the app's single mode only uses frame 0, and
  the worker now recovers from any associated abort.
