# 102 — Test Assets

## Source
2026 FIFA World Cup — 아르헨티나 vs 알제리 (전반 16:11, 0:0)
치지직/JTBC 중계 캡처

## Files
```
test-assets/arg-alg-frame.png    — 3.6MB, 스크린샷 1장 (경기 중 전체 필드 뷰)
test-assets/arg-alg-clip.mov     — 71MB, 화면 녹화 (경기 클립)
```

## Usage
- Phase 1 테스트: `arg-alg-frame.png` → i2i crayon 변환
- Phase 2 테스트: `arg-alg-clip.mov` → 프레임 추출 → 병렬 i2i → GIF 조립
- Phase 3 테스트: `arg-alg-clip.mov` → 키프레임 선택 / Grok V2V
- Phase 4 테스트: Before/After 데모 자산으로 사용 (랜딩 페이지)
