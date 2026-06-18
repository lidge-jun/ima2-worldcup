# ima2-worldcup — Roadmap (revised 260619)

## Phase 1: Foundation (PABCD #1) ✅ DONE
**Goal**: Next.js scaffold + OAuth + single image-to-image

- Next.js App Router + Tailwind CSS + Pretendard + Lucide
- Neobrutalism 2-color design system (red + black)
- Codex OAuth token paste
- Single image upload → GPT 5.4 mini i2i → styled image download
- 6 style presets (crayon, watercolor, oil, sketch, anime, custom)
- **Done**: tsc clean, next build pass, dev server verified

## Phase 2: Video Pipeline (PABCD #2) ✅ DONE
**Goal**: ffmpeg.wasm + frame extraction + parallel batch + GIF assembly

- ffmpeg.wasm 브라우저 통합 (COOP/COEP 헤더 준비됨)
- 비디오 업로드 + FPS 설정 + 프레임 추출
- N개 프레임 완전 병렬 i2i (1장 ≈ N장 시간)
- FrameStrip + ProgressBar + ETA
- GIF 조립 + 다운로드
- **Test**: `test-assets/arg-alg-clip.mov` (71MB, ARG vs ALG)
- Sub-plans: 121 (ffmpeg.wasm), 122 (parallel batch)

## Phase 3: Advanced Modes (PABCD #3) ✅ DONE
**Goal**: Video → single image + Grok V2V, 4개 모드 전부 활성

- 키프레임 피커 (5장 썸네일 선택)
- Grok V2V (xAI API)
- 모드 잠금 전부 해제
- **Test**: `test-assets/arg-alg-clip.mov` + `arg-alg-frame.png`
- Sub-plans: 131 (keyframe), 132 (grok v2v)

## Phase 4: Polish + Local Verification (PABCD #4)
**Goal**: 프로덕션 품질 + `ima2w serve` 로컬 CLI + 최종 검증

- 랜딩 페이지 (Before/After 실제 변환 결과)
- 반응형 모바일 레이아웃
- Share (클립보드 + X 링크) + History (localStorage)
- README.md + 스크린샷 + 사용 가이드
- `ima2w serve` CLI: dist/bin symlink → `npm run dev` 래퍼
- `ima2w setup` interactive token 설정
- 로컬 End-to-End 검증 (전 모드 테스트)
- **Done**: `ima2w serve` → 브라우저에서 4 모드 전부 작동
- Sub-plans: 141 (landing), 142 (polish), 143 (cli/ima2w)

## Phase 5: CI/CD + Publish (PABCD #5)
**Goal**: Vercel 배포 + npm publish + CI 파이프라인

- Vercel 커스텀 도메인 설정 (ima2-worldcup.lidge.dev)
- npm publish (ima2-worldcup 패키지)
- Next.js standalone output for npm dist
- GitHub Actions CI (tsc + build + lint)
- OG image + SEO meta
- **Done**: 도메인 접근 가능, `npm i -g ima2-worldcup` 설치 가능, CI green

---

## GitHub
https://github.com/lidge-jun/ima2-worldcup (public)

## Test Assets
`test-assets/arg-alg-frame.png` (3.6MB) + `arg-alg-clip.mov` (71MB)
2026 FIFA World Cup — 아르헨티나 vs 알제리

## Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Stack | Next.js + Vercel | SSR + API Routes, free tier |
| Video processing | Browser WASM ffmpeg | No server cost |
| Image model | gpt-5.4-mini (non-thinking) | Fast, parallel i2i |
| Auth | User's own Codex + xAI OAuth | No server keys |
| Parallel gen | N frames fully concurrent | 1장 ≈ N장 시간 |
| Output | GIF auto, MP4 on-demand | GIF = sharing format |
| Design | Neobrutalism, 2-color (red+black) | Anti-slop, indie vibe |
| Font | Pretendard + Inter | CJK-safe |
| Icons | Lucide React | No emoji |

## Devlog Numbering
```
00-09   Research/decisions
100     Phase 0 (design)
110-119 Phase 1 (foundation)
120-129 Phase 2 (video)
130-139 Phase 3 (advanced)
140-149 Phase 4 (polish + local)
150-159 Phase 5 (ci/cd + publish)
```
