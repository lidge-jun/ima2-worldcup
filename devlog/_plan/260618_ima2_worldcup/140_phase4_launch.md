# Phase 4 — Polish + Local Verification (revised)

## Goal
프로덕션 품질 + `ima2w serve` 로컬 CLI + End-to-End 검증
(Vercel/npm publish는 Phase 5로 이동)

## Scope
- 랜딩 페이지 (Before/After 실제 변환 결과)
- 반응형 모바일 레이아웃
- README.md + 스크린샷 + 사용 가이드
- Share (클립보드 + X 링크) + History (localStorage, max 20)
- `ima2w serve` CLI: dist/bin → symlink로 로컬 실행
- `ima2w setup` interactive token 설정
- 성능 최적화 (WASM 프리로드)
- 로컬 End-to-End 전 모드 검증 (test-assets 사용)

## NOT in Scope (→ Phase 5)
- Vercel 배포 + 커스텀 도메인
- npm publish
- GitHub Actions CI
- OG image + SEO meta
- OAuth redirect (토큰 페이스트 유지)

## Sub-plans
- 141_landing.md — 랜딩 페이지 + Before/After
- 142_polish_release.md — 반응형 + History + Share + README
- 143_cli_npm.md — CLI `ima2w serve/setup` + dist/bin symlink

## Done Criteria
- `ima2w serve` → localhost에서 4 모드 전부 작동
- test-assets로 실제 i2i + GIF 생성 검증
- 반응형 모바일 레이아웃
- README 완성 + 스크린샷

## Mockup
`mockups/phase4-launch.html`
