# Phase 1 — Foundation

## Goal
Next.js scaffold + OAuth 인증 + 단일 이미지 i2i 변환

## Scope
- Next.js App Router + Tailwind CSS 프로젝트 초기화
- Neobrutalism 디자인 시스템 구현 (100_phase0 토큰 기반)
- Codex OAuth 로그인 플로우 (GPT 이미지 생성용)
- xAI OAuth 로그인 플로우 (Grok V2V용, Phase 3에서 사용)
- 단일 이미지 업로드 → gpt-5.4-mini i2i → 스타일 이미지 다운로드
- 6개 스타일 프리셋 프롬프트 작성 (crayon, watercolor, oil, sketch, anime, custom)
- Vercel 첫 배포

## UI State (Phase 1 완료 시)
- Upload 패널: 이미지만 지원 (비디오 비활성)
- Mode: Image 모드만 활성, 나머지 3개 잠금(🔒)
- Style picker: 6개 프리셋 전부 작동
- FPS 슬라이더: 숨김 (이미지 모드에 불필요)
- Preview: 단일 이미지 결과 표시
- Generate 버튼 → 로딩 스피너 → 결과 이미지
- Download 버튼만 활성 (Retry/Share 비활성)
- 로그인 안 됐으면 "Sign In to Generate" 상태

## Technical Tasks
1. `npx create-next-app@latest` + Tailwind + TypeScript
2. 네오브루탈리즘 CSS 변수 + 글로벌 스타일
3. 레이아웃: Header + 2-column (Upload+Settings | Preview)
4. OAuth: Codex token input/paste UI (브라우저 OAuth redirect는 Phase 4)
5. API Route: `/api/generate` — GPT 5.4 mini image generation proxy
6. 이미지 업로드 → base64 → API → 결과 이미지 표시
7. 스타일 프리셋 프롬프트 매핑
8. Vercel 배포 + 환경변수 설정

## Done Criteria
- 이미지 1장 업로드 → 크레용 스타일 이미지 1장 생성/다운로드
- Codex OAuth 토큰으로 인증 후 생성 가능
- Vercel에 배포되어 URL로 접근 가능

## Mockup
`mockups/phase1-foundation.html`
