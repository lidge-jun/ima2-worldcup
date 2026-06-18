# 132 — Grok V2V Integration

## Files: NEW
```
lib/grok/v2v.ts             — grokVideoToVideo(videoBlob, stylePrompt, grokToken) → resultVideoUrl
                              xAI API: POST /v1/video/generations (or equivalent)
                              Reference: ima2-gen/lib/grokImageCore.js
                              Poll for completion if async

lib/grok/auth.ts            — xAI OAuth token validation
                              HEAD /v1/models with xAI token

components/GrokProgress.tsx — V2V 전용 프로그레스:
                              "Uploading to Grok..." → "Grok processing..." → "Downloading result..."
                              Grok 로고/뱃지 표시
                              예상 시간: API 응답 기반
```

## Files: MODIFY
```
components/AuthModal.tsx    — xAI/Grok 탭 추가
                              "Paste your xAI API token"
                              Validate → save to localStorage (ima2wc_grok_token)

components/AuthStatus.tsx   — 듀얼 뱃지: "codex ✓" + "grok ✓"

components/ModeSelector.tsx — Grok V2V 잠금 해제, "GROK" 뱃지 표시
                              Grok 토큰 없으면 "Grok token required" 표시

app/page.tsx                — Grok V2V 모드:
                              1. 비디오 업로드
                              2. 스타일 선택
                              3. Generate → grokVideoToVideo()
                              4. GrokProgress 표시
                              5. 결과 비디오 Preview에 재생
                              6. Download MP4

components/PreviewPanel.tsx — 비디오 결과 시 <video> 태그로 재생
```

## Done (= Phase 3 Complete)
- Grok V2V: 비디오 → xAI API → 스타일 비디오 다운로드
- 4개 모드 전부 활성, 잠금 아이콘 없음
- Codex + Grok 듀얼 인증 뱃지
