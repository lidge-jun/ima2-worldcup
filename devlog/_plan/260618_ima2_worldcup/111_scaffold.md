# 111 — Next.js Scaffold + Neobrutalism Design System

## Audit Fix: Manual install (B2), 2-color palette (B1), Pretendard (M4), tsconfig replace (M1)

## Files: NEW
```
app/layout.tsx              — Root layout, Pretendard + Inter font, meta tags
app/page.tsx                — Main 2-column layout shell (empty panels), min 1-col responsive
app/globals.css             — Neobrutalism CSS vars (2-color: red + black) + global styles
components/Header.tsx       — Logo + GitHub link + auth slot (children prop)
components/Panel.tsx        — Reusable panel (black header + white body)
next.config.ts              — Vercel-ready config
postcss.config.mjs          — PostCSS for Tailwind
```

## Files: MODIFY (replace)
```
package.json                — Add next, react, react-dom, tailwind, postcss, autoprefixer,
                              lucide-react, pretendard (font)
tsconfig.json               — REPLACE with Next.js TS config (jsx:preserve, module:esnext,
                              moduleResolution:bundler, paths, noEmit, include app/components/lib)
```

## CSS Variables (2-color anti-slop)
```css
:root {
  --bg: #fffbe6;
  --surface: #fff;
  --text: #111;
  --border: #111;
  --shadow: #111;
  --accent: #ff6b6b;
  --hover: #ffeaa7;
}
```

## Font Stack
```css
font-family: 'Pretendard', 'Inter', system-ui, sans-serif;
```
Pretendard via `pretendard` npm package CSS import in globals.css.

## Commands (manual install, not create-next-app)
```bash
npm install next react react-dom
npm install -D typescript @types/react @types/node tailwindcss postcss autoprefixer
npm install lucide-react pretendard
```

## Done
- `npm run dev` → 로컬에서 2-column 빈 레이아웃 렌더링 (≤768px: 1-column)
- 헤더에 로고 + GitHub 링크 + auth slot
- 2-color 네오브루탈리즘 (red + black, cream bg)
- Pretendard 폰트 로드 확인
