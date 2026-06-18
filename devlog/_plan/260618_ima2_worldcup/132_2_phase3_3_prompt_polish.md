# Phase 3.3 — Prompt Polish (스케치북 느낌 강화)

## Goal
변환 결과가 진짜 스케치북에 그린 것 같도록 프롬프트 + 후처리 개선

## Issues (사용자 피드백)
1. **점수판**: 현재 그대로 유지됨 → 이미지 컨셉에 맞게 손글씨/크레용 스타일로 변환 필요
2. **방송사 로고**: JTBC, FIFA 로고 등이 그대로 남음 → 완전히 제거하여 스케치북 느낌

## Approach Options (Interview에서 확정)
- 프롬프트 강화: "Remove all broadcast logos, TV overlays, and scoreboard graphics. Replace the scoreboard with hand-drawn text..."
- 후처리: ffmpeg overlay로 로고 영역 마스킹?
- 이미지 크롭: 점수판/로고 영역 자동 감지 후 제거?

## Open Questions
- 프롬프트만으로 충분한지, 별도 전처리/후처리가 필요한지?
- 점수판을 완전 제거 vs 크레용 스타일로 재작성?
- 방송사 워터마크 위치가 고정인지 (상단 코너)?
