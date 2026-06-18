# Phase 3.3 — Prompt Polish (스케치북 느낌 강화)

## Confirmed Decisions
- 점수판: 손글씨 스타일로 교체 (각 화풍별 적용)
- 방송사 로고: 프롬프트로 제거
- 전체 스타일 프리셋에 공통 적용

## Prompt Enhancement Strategy

### 공통 접미사 (모든 스타일에 추가)
```
Remove all TV broadcast logos, channel watermarks, and overlay graphics completely.
Replace any scoreboard or score display with hand-drawn text in the same art style,
showing only the score numbers. Make it look like a page from a sketchbook —
no digital/broadcast elements should remain.
```

### 스타일별 점수판 지시
- crayon: "hand-written in thick crayon letters"
- watercolor: "painted in loose watercolor brush strokes"  
- oil: "painted in oil with visible brushstrokes"
- sketch: "sketched in pencil with rough handwriting"
- anime: "drawn in manga speech-bubble style lettering"

## Files
```
MODIFY: lib/styles.ts — 각 프리셋 프롬프트에 공통 접미사 추가 + 스타일별 점수판 지시
```

## Done Criteria
- test-assets/arg-alg-frame.png 변환 시:
  - JTBC/FIFA 로고 없음
  - 점수판이 해당 화풍의 손글씨로 재현됨
  - 전체적으로 스케치북에 그린 느낌

## Verification
- 동일 이미지로 crayon + watercolor 각 1장 변환 → 로고 없음 + 손글씨 점수판 확인
