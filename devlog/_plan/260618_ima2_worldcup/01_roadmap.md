# ima2-worldcup — Roadmap

## Phase 1: Foundation (PABCD #1)
**Goal**: Next.js scaffold + OAuth + single image-to-image

- Next.js App Router + Tailwind CSS setup
- Vercel deployment config
- Codex OAuth flow (user logs in with own ChatGPT account)
- xAI OAuth flow (user logs in with own Grok account)
- Single image upload → GPT 5.4 mini i2i → styled image download
- Style preset picker (crayon, watercolor, oil, sketch, anime, custom)
- **Done when**: Upload 1 image → get 1 styled image back, deployed on Vercel

## Phase 2: Video Pipeline (PABCD #2)
**Goal**: ffmpeg.wasm + frame extraction + parallel batch + GIF assembly

- ffmpeg.wasm integration (client-side, browser WASM)
- Video upload + frame extraction at configurable FPS (0.33–3 fps)
- Parallel image generation (batch N frames simultaneously, like ima2-gen)
- Progress UI (frame X/N, estimated time)
- GIF/MP4 reassembly from styled frames
- **Done when**: 10-sec MP4 → crayon GIF in ~3 minutes via parallel generation

## Phase 3: Advanced Modes (PABCD #3)
**Goal**: Video → single image + Grok V2V

- Video → keyframe extraction → single styled image
- Grok V2V integration (video-to-video via xAI API)
- Mode switching UI (4 modes fully functional)
- **Done when**: All 4 modes work end-to-end

## Phase 4: Polish & Launch (PABCD #4)
**Goal**: Production quality + open-source release

- Landing page / marketing site
- README + docs + GitHub repo setup
- Custom domain deployment (e.g., ima2-worldcup.lidge.dev)
- Open-source release (MIT license)
- Share/social features (direct Chzzk/Twitter share?)
- Performance optimization (WASM loading, generation queue)
- **Done when**: Public site live, GitHub repo public, README complete

---

## Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Stack | Next.js + Vercel | SSR + API Routes, free tier, easy deploy |
| Video processing | Browser WASM ffmpeg | No server cost, user's resources |
| Image model | gpt-5.4-mini (non-thinking) | Fast, cheap, good enough for style transfer |
| Auth | User's own Codex + xAI OAuth | No server keys, no cost to operator |
| Parallel gen | Batch frames simultaneously | ~3 min for 10-sec clip (not serial) |
| Output | GIF primary, MP4 secondary | GIF is the Chzzk/Twitter sharing format |
