# ima2-worldcup

AI fan art style transfer for sports highlights — turn World Cup clips into copyright-safe crayon, watercolor, oil, sketch, or anime artwork.

## Modes

| Mode | Input | Output | Engine |
|------|-------|--------|--------|
| **Image** | Single image | Styled image | GPT 5.4 mini |
| **Frames→Video** | Video file | Styled MP4 | GPT 5.4 mini + ffmpeg.wasm |
| **Video→1pic** | Video file | Single styled keyframe | GPT 5.4 mini + ffmpeg.wasm |
| **Grok V2V** | Video file | Styled video | xAI Grok |

## Quick Start

### Local Development

```bash
git clone https://github.com/lidge-jun/ima2-worldcup.git
cd ima2-worldcup
npm install
npm run dev
# → Next.js on http://localhost:3477
# → openai-oauth proxy on http://127.0.0.1:10531
```

The dev script starts both the Next.js app and the openai-oauth proxy together.

### Deploy to Vercel

```bash
vercel deploy
```

No code changes needed. Users provide their OpenAI API key via the Connect button (proxy is local-only).

### Install via npm

```bash
npm i -g ima2-worldcup
ima2w serve
# → http://localhost:3477 (browser auto-opens)
```

## Architecture

```
Browser                          Server (Next.js API Routes)
┌─────────────────────┐         ┌──────────────────────┐
│  Upload video/image  │         │  /api/generate       │
│  ffmpeg.wasm         │────────▶│  → openai-oauth proxy│
│  (frame extraction,  │         │    or direct API key │
│   MP4/GIF assembly)  │         │  → GPT 5.4 mini i2i │
│  Preview + Download  │         │                      │
└─────────────────────┘         └──────────────────────┘
```

- **Video processing runs entirely in the browser** via ffmpeg.wasm — no server cost
- **Image generation** proxied through Next.js API routes to OpenAI
- **Auth**: Codex OAuth (local proxy) or direct API key (Vercel)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4 |
| Design | Neobrutalism (red + black) |
| Video | ffmpeg.wasm (browser) |
| Image AI | GPT 5.4 mini (image_generation tool) |
| Video AI | xAI Grok V2V |
| Font | Pretendard + system |
| Icons | Lucide React |

## Styles

6 presets: **Crayon**, **Watercolor**, **Oil**, **Sketch**, **Anime**, **Custom** (free-form prompt)

## License

MIT
