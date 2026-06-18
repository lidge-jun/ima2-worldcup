# Phase 1 Build Plan — Foundation

통합 실행 계획. 세부 스펙은 111~115 참조.

## Part 1: 요약

ima2-worldcup의 첫 동작하는 버전을 만듭니다. 사용자가 이미지 1장을 업로드하고, 화풍(크레용/수채화 등)을 고르고, Generate를 누르면 GPT 5.4 mini가 스타일 변환한 이미지를 보여주고 다운로드할 수 있습니다. Codex OAuth 토큰을 붙여넣는 방식으로 인증하고, Vercel에 배포합니다.

## Part 2: File Map

### Step 1 — Scaffold (111)
```
NEW  next.config.ts
NEW  tailwind.config.ts
NEW  app/layout.tsx
NEW  app/page.tsx
NEW  app/globals.css
MODIFY  package.json        — add next, react, tailwind, lucide-react, pretendard
MODIFY  tsconfig.json        — Next.js paths
```

### Step 2 — Components (112)
```
NEW  components/Header.tsx          — 로고 + GitHub + AuthStatus
NEW  components/Panel.tsx           — 네오브루탈리즘 패널 (black header + white body)
NEW  components/UploadZone.tsx      — 드래그앤드롭 이미지 업로드, 파일 선택/제거
NEW  components/ModeSelector.tsx    — 4-mode 2x2 grid, Image만 활성
NEW  components/StylePicker.tsx     — 6 chip, Custom textarea
NEW  components/FpsSlider.tsx       — range input (Phase 1에서 숨김)
```

### Step 3 — Auth (113)
```
NEW  lib/auth.ts                    — localStorage token CRUD
NEW  components/AuthModal.tsx       — 토큰 붙여넣기 모달 (Codex tab)
NEW  components/AuthStatus.tsx      — 헤더 뱃지 "codex ✓" or "Sign In"
```

### Step 4 — API (114)
```
NEW  lib/styles.ts                  — 6 스타일 프리셋 프롬프트
NEW  lib/generate.ts                — OpenAI Responses API 래퍼
NEW  app/api/generate/route.ts      — POST handler (imageB64 + style + token → resultB64)
```

### Step 5 — Preview + Deploy (115)
```
NEW  components/PreviewPanel.tsx    — idle/auth/generating/done/error 5-state
NEW  components/GenerateButton.tsx  — disabled/ready/loading 3-state
NEW  components/DownloadBar.tsx     — Download PNG (active), Retry/Share (disabled)
NEW  vercel.json                    — region icn1, COOP/COEP headers
```

## Anti-Slop 적용
- 아이콘: Lucide React (이모지 금지)
- 폰트: Pretendard + Inter fallback
- Accent: #ff6b6b (red) + #111 (black) 2색만
- Loading: skeleton placeholder (spinner 금지)
- 모바일: 최소 1-column 반응형

## Done Criteria
1. `npm run dev` → 이미지 업로드 → 스타일 선택 → Generate → 결과 표시 → Download
2. Codex 토큰 인증 후 생성 가능
3. `npx tsc --noEmit` 통과
4. Vercel 배포 가능 상태
