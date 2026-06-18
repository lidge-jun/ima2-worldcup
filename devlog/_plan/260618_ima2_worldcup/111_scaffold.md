# 111 — Next.js Scaffold + Neobrutalism Design System

## Files: NEW
```
app/layout.tsx              — Root layout, Inter font, meta tags
app/page.tsx                — Main 2-column layout shell (empty panels)
app/globals.css             — Neobrutalism CSS variables + global styles
components/Header.tsx       — Logo + GitHub + Sign In button
components/Panel.tsx        — Reusable panel (black header + white body)
tailwind.config.ts          — Custom colors (cream, accent-1~5)
next.config.ts              — Vercel-ready config
```

## CSS Variables (from 100_phase0_design.md)
```css
:root {
  --bg: #fffbe6;
  --surface: #fff;
  --text: #111;
  --border: #111;
  --shadow: #111;
  --accent-1: #ff6b6b;
  --accent-2: #6c5ce7;
  --accent-3: #a29bfe;
  --accent-4: #fd79a8;
  --accent-5: #ffeaa7;
}
```

## Commands
```bash
npx create-next-app@latest . --ts --tailwind --app --src-dir=false --import-alias="@/*"
```

## Done
- `npm run dev` → 로컬에서 2-column 빈 레이아웃 렌더링
- 헤더에 로고 + 버튼 표시
- 네오브루탈리즘 스타일 적용 (3px border, shadow, cream bg)
