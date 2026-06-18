# Phase 3 Build Plan — Advanced Modes

## Part 1: 요약

비디오에서 키프레임 5장을 뽑아 하나를 골라 스타일 변환하는 모드와, Grok V2V로 영상 전체를 직접 스타일 변환하는 모드를 추가합니다. 이걸로 4개 모드 전부 활성화됩니다.

## Part 2: File Map

### Step 1 — Keyframe Picker (131)

NEW:
```
lib/ffmpeg/keyframes.ts      — extractKeyframes(file, count=5): 균등 간격 5프레임
components/KeyframePicker.tsx — 5개 썸네일 1행, 클릭 선택, timestamp 라벨
```

MODIFY:
```
components/ModeSelector.tsx   — single 모드 잠금 해제 (locked: false)
app/page.tsx                  — single 모드:
                                비디오 업로드 → extractKeyframes(5) → KeyframePicker
                                사용자 선택 → 해당 프레임 b64로 generateImage() → PNG
```

### Step 2 — Grok V2V (132)

NEW:
```
lib/grok/v2v.ts              — grokVideoToVideo(videoFile, stylePrompt, grokToken)
                               xAI API 호출, 비동기 polling if needed
lib/grok/auth.ts             — validateGrokToken(token) via /api/validate-grok
app/api/validate-grok/route.ts — POST { token } → xAI GET /v1/models → valid/invalid
components/GrokProgress.tsx   — "Uploading..." → "Processing..." → "Done" 3-step
```

MODIFY:
```
components/AuthModal.tsx      — 탭 추가: Codex | Grok, Grok 토큰 input+validate
components/AuthStatus.tsx     — 듀얼 뱃지 "codex ✓" + "grok ✓" (optional)
components/ModeSelector.tsx   — v2v 잠금 해제, Grok 토큰 없으면 "requires grok" 표시
components/PreviewPanel.tsx   — 비디오 결과: <video> 재생 + Download MP4
app/page.tsx                  — v2v 모드: file → grokVideoToVideo → video URL → Preview
lib/auth.ts                   — getGrokToken/saveGrokToken 이미 존재, 확인만
```

## Done Criteria
1. single 모드: 비디오 → 5 키프레임 → 1 선택 → 스타일 변환 → Download PNG
2. v2v 모드: 비디오 → Grok API → 스타일 비디오 → Download MP4
3. 4개 모드 전부 잠금 해제 (Lock 아이콘 없음)
4. Codex + Grok 듀얼 인증 뱃지
5. tsc + build pass
