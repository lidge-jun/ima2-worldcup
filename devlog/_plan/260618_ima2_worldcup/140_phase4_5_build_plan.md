# Phase 4+5 — Polish + Deploy (PABCD Build Plan)

**Goal**: 프로덕션 품질 다듬기 + Vercel 배포 + npm publish — 둘 다 배포 가능한 상태

## Phase 4A: README + 구조 정리

### NEW: `README.md`
- 프로젝트 설명 (1줄), 기능 목록 (4 modes), 스크린샷 placeholder
- Quick Start (로컬): `npm run dev` → openai-oauth proxy 자동 시작
- Quick Start (Vercel): `vercel deploy` → API key 입력
- Quick Start (npm): `npm i -g ima2-worldcup` → `ima2w serve`
- Architecture: browser-only FFmpeg, 4 modes 설명
- Tech stack table

### MODIFY: `package.json`
- `description` 보강
- `homepage`, `repository`, `bugs` 필드 추가
- `keywords` 확장

## Phase 4B: CLI `ima2w serve`

### NEW: `bin/ima2w.mjs`
- `#!/usr/bin/env node`
- Subcommands: `serve` (default), `setup`, `--help`, `--version`
- `serve`: Next.js standalone server + openai-oauth proxy 동시 실행
  - 포트: 기본 3477 (--port flag)
  - 브라우저 자동 열기 (`open` 패키지 or `child_process`)
- `setup`: interactive token 입력 → `~/.ima2-worldcup/auth.json` 저장

### MODIFY: `next.config.ts`
- `output: 'standalone'` 추가 (npm dist용, Vercel은 자동 감지)

### MODIFY: `package.json`
- `"bin": { "ima2w": "bin/ima2w.mjs" }`
- `"files"` 배열: bin, lib, app, components, public, .next/standalone

## Phase 5A: Vercel 배포

### NEW: `vercel.json`
- COEP/COOP 헤더 (next.config과 중복이지만 Vercel edge에서 보장)
- rewrites/redirects 필요 시

### MODIFY: `app/api/detect-auth/route.ts`
- Vercel 환경에서 proxy 감지 스킵 → 바로 apikey 모드
- `VERCEL` env var 체크

### 배포
- `vercel deploy --prod`
- 도메인: 기본 *.vercel.app (커스텀 도메인은 수동)

## Phase 5B: npm publish

### 빌드 + 배포
- `npm run build` → standalone output
- `npm publish` → npmjs.com/package/ima2-worldcup
- 검증: `npx ima2-worldcup serve` → 로컬 작동

## File Change Summary

| File | Action | Phase |
|------|--------|-------|
| `README.md` | NEW | 4A |
| `package.json` | MODIFY | 4A, 4B |
| `bin/ima2w.mjs` | NEW | 4B |
| `next.config.ts` | MODIFY | 4B |
| `vercel.json` | NEW | 5A |
| `app/api/detect-auth/route.ts` | MODIFY | 5A |

## Done Criteria
- [ ] README.md 완성
- [ ] `npm run dev` → 3477에서 앱 + proxy 동시 실행
- [ ] `vercel deploy` → 퍼블릭 URL에서 앱 접근 가능
- [ ] `npm publish` → `npx ima2-worldcup serve` 로컬 작동
- [ ] tsc clean, next build pass

## NOT in Scope
- 랜딩 페이지 (Before/After) — 별도 이터레이션
- 반응형 모바일 레이아웃 — 별도 이터레이션
- OAuth redirect flow — 토큰 페이스트 유지
- GitHub Actions CI — Phase 5 이후 별도
- OG image + SEO meta — Phase 5 이후 별도
