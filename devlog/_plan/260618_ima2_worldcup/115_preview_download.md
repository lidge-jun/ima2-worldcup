# 115 — Preview Panel + Download + Vercel Deploy

## Files: NEW
```
components/PreviewPanel.tsx — 3 states:
                              1. idle: "Upload & Generate" placeholder
                              2. auth-required: "Sign In to Generate" + CTA
                              3. generating: spinner + "Applying crayon style..."
                              4. done: result image + download button
                              5. error: error message + retry

components/GenerateButton.tsx — States:
                              - disabled (no file or no auth)
                              - ready: "GENERATE" (purple, shadow)
                              - loading: "GENERATING..." (animated)

components/DownloadBar.tsx  — Download PNG button (active)
                              Retry button (Phase 1: disabled)
                              Share button (Phase 1: disabled)
```

## Files: MODIFY
```
app/page.tsx                — Wire up full flow:
                              1. Upload → setFile
                              2. Select style
                              3. Click Generate → POST /api/generate
                              4. Show loading in Preview
                              5. Show result image
                              6. Click Download → save PNG

app/layout.tsx              — Add Vercel Analytics (optional)
```

## Files: NEW (deploy)
```
vercel.json                 — Region: icn1 (Seoul), headers for COOP/COEP (Phase 2 prep)
.env.example                — Document required env vars (none for Phase 1 — token is client-side)
```

## Full Flow (Phase 1)
```
[Upload image] → [Select Crayon] → [Generate]
  → POST /api/generate { imageB64, style:"crayon", token }
  → OpenAI Responses API (gpt-5.4-mini)
  → resultB64
  → Preview shows styled image
  → [Download PNG]
```

## Vercel Deploy
```bash
vercel --prod
# or: git push → Vercel auto-deploy
```

## Done (= Phase 1 Complete)
- 이미지 업로드 → 스타일 선택 → Generate → 결과 표시 → Download
- Codex 토큰 인증 필수
- Vercel URL로 접근 가능
- 잠긴 모드 3개 보이지만 클릭 불가
