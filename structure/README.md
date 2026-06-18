# ima2-worldcup — Architecture

AI style transfer web app for sports highlights. Converts video/image clips into copyright-safe artwork using GPT image generation (gpt-5.4-mini) and Grok V2V.

## Stack

- **Frontend**: Next.js (App Router) + Tailwind CSS
- **Deployment**: Vercel
- **Video Processing**: Client-side WASM ffmpeg (browser, user's resources)
- **Image Generation**: GPT 5.4 mini (non-thinking) via user's Codex OAuth, parallel batch
- **Video Generation**: Grok V2V via user's xAI OAuth
- **Auth**: User brings own OAuth tokens (Codex + xAI)

## Directory Structure

```
app/                  Next.js App Router pages
  page.tsx            Main upload + generate UI
  api/                API routes (OAuth token relay)
  layout.tsx          Root layout
components/           React components
  upload/             Upload zone, drag-and-drop
  settings/           Mode selector, style picker, FPS slider
  preview/            Result preview, download actions
  auth/               OAuth login flows
lib/
  ffmpeg/             WASM ffmpeg wrapper (frame extraction, GIF assembly)
  generate/           GPT image-to-image pipeline (parallel batch)
  grok/               Grok V2V adapter
  styles/             Style preset prompts
  oauth/              Codex OAuth + xAI OAuth flows
devlog/
  _plan/              Active plans + roadmap
  _fin/               Completed work
structure/            Architecture docs
```

## Pipeline

```
Input (MP4/GIF/Image)
  → [Browser WASM] Frame extraction (ffmpeg.wasm)
  → [API] Parallel image-to-image (gpt-5.4-mini, non-thinking)
     Each frame + style prompt → styled frame (batched)
  → [Browser WASM] Reassembly (ffmpeg.wasm → GIF/MP4)
  → Output (download / share)
```

## Modes

1. **Image → Image**: 1 frame in, 1 styled frame out
2. **Video → Frames → GIF/MP4**: Extract at user-selected FPS (0.33–3 fps), style each, reassemble
3. **Video → Single Image**: Extract best keyframe, style it
4. **Grok V2V**: Send entire video to Grok video-to-video API
