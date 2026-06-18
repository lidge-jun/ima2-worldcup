# Phase 5 — CI/CD + Publish

## Goal
Vercel 배포 + npm publish + CI 파이프라인

## Scope
- Vercel 프로덕션 배포
- 커스텀 도메인 (ima2-worldcup.lidge.dev)
- npm publish (ima2-worldcup 패키지, global install)
- Next.js standalone output for npm distribution
- GitHub Actions CI (tsc + build + lint on PR)
- OG image + SEO meta
- OAuth redirect 플로우 개선 (토큰 페이스트 → 원클릭)

## Sub-plans
- 151_vercel_deploy.md (TBD)
- 152_npm_publish.md (TBD)
- 153_github_actions.md (TBD)

## Done Criteria
- ima2-worldcup.lidge.dev 접근 가능
- `npm i -g ima2-worldcup && ima2w serve` 작동
- GitHub Actions CI green on main
