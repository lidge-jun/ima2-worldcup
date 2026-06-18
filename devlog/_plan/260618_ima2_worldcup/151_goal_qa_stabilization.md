# 151 — Goal QA Stabilization

## Context
Goal continuation after repeated browser MP4/gallery/download failures requested two additional PABCD passes followed by fresh QA. The focus was root-cause stabilization, not QA-only symptom checks.

## PABCD Passes
- Pass 1: FFmpeg browser transactions were serialized so the singleton worker/FS cannot interleave write, exec, read, and cleanup sequences across concurrent jobs.
- Pass 2: Queue cancellation now prevents canceled async jobs from updating preview state or saving gallery results after completion.
- Follow-up QA fix: Frames mode label changed from `Frames→GIF` to `Frames→MP4`.

## Additional Bugs Found During Fresh Browser QA
- Odd generated image dimensions caused H.264 MP4 assembly to fail with `width not divisible by 2`, yet the UI could still reach a download-looking state with an empty video blob.
- One-second sparse videos could fail Video→1pic keyframe extraction because the extractor skipped timestamp `0` and probed only later timestamps that decoded no frames.

## Implementation Evidence
- `lib/ffmpeg/worker.ts`: transaction queue introduced in prior pass.
- `lib/ffmpeg/assemble.ts`: MP4 assembly now pads odd dimensions to even dimensions, checks FFmpeg exit code, and rejects empty MP4 output.
- `lib/ffmpeg/keyframes.ts`: keyframe extraction now probes `0:00` first, clamps very short videos to one representative frame, checks FFmpeg exit codes, and rejects empty extracted frames.
- `app/page.tsx`: canceled job completions are ignored in prior pass.
- `components/ModeSelector.tsx`: frames mode label now reports MP4.

## Commits
- `d232df6 fix: serialize ffmpeg browser transactions`
- `1cca197 fix: ignore canceled queue job completions`
- `0703985 fix: label frames mode as mp4`
- `d9cba79 fix: stabilize browser ffmpeg video outputs`

## Verification Evidence
- `npx tsc --noEmit --incremental false`: exit 0 after the FFmpeg output fixes.
- `npm run build`: exit 0 after the FFmpeg output fixes; standalone static/public assets copied.
- Standalone server: `PORT=3488 HOSTNAME=127.0.0.1 node .next/standalone/server.js` served the rebuilt app.
- Auth mode: `/api/detect-auth` returned proxy availability through the local OpenAI OAuth proxy.
- Real image generation smoke: `/api/generate` succeeded through proxy auth with a PNG result.
- Video→1pic browser QA: `/tmp/ima2-worldcup-qa-tiny.mp4` produced a `0:00` keyframe, completed generation, showed `Download`, and rendered a generated image (`1671x941`, data URL length `4456406`) with zero browser warning/error entries after the pass baseline.
- Frames→MP4 browser QA: the same MP4 fixture completed generation, showed `Download MP4`, and produced a playable `video/mp4` blob (`607597` bytes, `duration: 1`, `readyState: 1`) with zero browser warning/error entries after the pass baseline.
- Gallery replay QA: selecting the newest gallery item restored the same nonempty MP4 preview (`607597` bytes) and `Download MP4`.
- Browser resource diagnostics: performance resource entries reported no failed `responseStatus >= 400` requests during the final pass.
- Packaging/readiness from prior final QA: `node bin/ima2w.mjs --help`, `node bin/ima2w.mjs --version`, and `npm pack --dry-run` all passed, with standalone/public FFmpeg assets included.

## Residual Notes
- `cli-jaw browser network --json --limit 120` returned `Invalid URL` in this local jaw runtime, so final network evidence used browser `performance.getEntriesByType('resource')` instead.
- The app still intentionally requires a Grok token for Grok V2V mode; this goal's verified flows covered image generation, Frames→MP4, Video→1pic, gallery replay, standalone launch, and npm packaging readiness.
