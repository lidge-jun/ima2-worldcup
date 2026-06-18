# Phase 4 — Polish & Launch

## Goal
프로덕션 품질 + 오픈소스 릴리즈 + 커스텀 도메인

## Scope
- 랜딩 페이지 (Before/After 데모, 기능 소개)
- 반응형 모바일 레이아웃
- README.md + 사용 가이드 + 스크린샷
- GitHub 퍼블릭 레포 생성
- 커스텀 도메인 연결 (ima2-worldcup.lidge.dev 등)
- OAuth 개선: 브라우저 OAuth redirect 플로우 (토큰 페이스트 → 원클릭 로그인)
- Share 기능 (결과 이미지/GIF를 클립보드/SNS 공유)
- 히스토리 (최근 변환 기록, localStorage)
- 성능 최적화 (WASM 프리로드, 생성 큐 튜닝)
- SEO + OG 이미지

## UI State (Phase 4 완료 시)
- 풀 랜딩 페이지: 히어로 + Before/After + 기능 카드 + CTA
- 모바일 반응형: 1-column 레이아웃, 터치 최적화
- Share 버튼 활성: 클립보드 복사 / 트위터 공유 / 치지직 링크
- History 사이드바: 최근 변환 썸네일 리스트
- Footer: GitHub 링크, MIT 라이선스, 버전

## Technical Tasks
1. 랜딩 페이지 디자인 + 구현 (네오브루탈리즘)
2. Before/After 슬라이더 컴포넌트
3. 반응형 CSS (모바일 breakpoint)
4. GitHub repo 생성 + README 작성
5. Vercel 커스텀 도메인 설정
6. OAuth redirect 플로우 구현
7. Share API (Web Share API + 클립보드)
8. localStorage 히스토리
9. WASM 프리로드 + Service Worker 캐시
10. OG 이미지 + SEO 메타

## Sub-plans
- 141_landing.md — 랜딩 페이지 + Before/After
- 142_polish_release.md — 반응형 + History + Share + GitHub + 도메인
- 143_cli_npm.md — CLI `ima2w serve` + npm global install + 로컬 토큰

## Done Criteria
- 커스텀 도메인에서 누구나 접근 가능
- `npm i -g ima2-worldcup && ima2w serve` → 로컬에서도 사용 가능
- GitHub 퍼블릭 레포 + README + 스크린샷
- 모바일에서 사용 가능
- Share 버튼으로 결과 공유 가능

## Mockup
`mockups/phase4-launch.html`
