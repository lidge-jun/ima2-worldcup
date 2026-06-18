# 122 — Parallel Batch Generation + Progress UI

## Files: NEW
```
lib/generate-batch.ts       — generateBatch(frames: Frame[], style, token, opts) → StyledFrame[]
                              opts: { concurrency: 3, onProgress: (done, total, currentFrame) => void }
                              Promise.allSettled with concurrency limiter (p-limit pattern)
                              Each frame: POST /api/generate → styled B64
                              Failed frames: retry 1x, then skip with error marker

components/FrameStrip.tsx   — 가로 스크롤 프레임 스트립
                              각 프레임: 60x40px 썸네일
                              상태: pending(회색) → active(보더강조) → done(보라) → error(빨강)
                              현재 처리중인 프레임 하이라이트

components/ProgressBar.tsx  — Candy stripe animated bar (네오브루탈리즘)
                              Props: current, total, label, eta
                              ETA 계산: (elapsed / done) * remaining

components/ModeSelector.tsx — MODIFY: Frames→GIF 모드 잠금 해제 (🔒 제거)
```

## Files: MODIFY
```
app/page.tsx                — Frames→GIF 모드 선택 시:
                              1. 비디오 업로드 → extractFrames(fps)
                              2. generateBatch(frames, style, token)
                              3. FrameStrip + ProgressBar 표시
                              4. 완료 → assembleGif → Preview에 GIF 표시
                              5. Download GIF / Download MP4 선택

components/FpsSlider.tsx    — Frames→GIF 모드에서 표시
                              값 변경 시 "→ N frames" 실시간 업데이트
```

## Concurrency Model
```typescript
async function generateBatch(frames, style, token, opts) {
  const limit = pLimit(opts.concurrency ?? 3);
  const results = await Promise.allSettled(
    frames.map((frame, i) =>
      limit(async () => {
        const result = await generateImage(frame.b64, style, token);
        opts.onProgress?.(i + 1, frames.length, frame);
        return { ...frame, styledB64: result };
      })
    )
  );
  return results.filter(r => r.status === 'fulfilled').map(r => r.value);
}
```

## Done (= Phase 2 Complete)
- 10초 MP4 @ 1fps → 10 프레임 추출 → 3 병렬 생성 → ~3분
- FrameStrip에서 실시간 진행 확인
- ProgressBar + ETA 표시
- 완료 → GIF 미리보기 + 다운로드
