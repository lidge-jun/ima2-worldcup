# 101 — Product Decisions Log

Interview + Frontend audit에서 확정된 결정 사항.

## Confirmed Decisions

| # | 결정 | 선택 | 근거 |
|---|------|------|------|
| D1 | 법적 포지셔닝 | "팬아트 스타일 변환 도구" | "저작권 회피" 표현 금지, 안전한 마케팅 |
| D2 | 비디오 길이 제한 | 제한 없음 | 사용자 책임, 경고만 표시 ("30프레임 이상은 시간 소요") |
| D3 | 데모 자산 | 사용자가 직접 테스트하며 제작 | Phase 4에서 실제 변환 결과 사용 |
| D4 | 라이선스 | MIT | |
| D5 | xAI 토큰 | 선택사항 | Grok V2V만 사용, 없어도 나머지 3모드 작동 |
| D6 | 히스토리 | 기본 ON, max 20개, 삭제 가능 | localStorage |
| D7 | 출력 포맷 | GIF 자동, MP4 on-demand 버튼 | |
| D8 | OAuth Phase 1 | 토큰 붙여넣기 | Phase 4에서 redirect 개선 |
| D9 | 도메인 | ima2-worldcup.lidge.dev (가칭) | Phase 4에서 확정 |
| D10 | 공유 | Download + 클립보드 복사 | Phase 4에서 X/치지직 링크 추가 |

## Parallelism Model (핵심)
- N개 프레임 전부 동시 API 호출 (concurrency limit 없음)
- 1장 생성 시간 ≈ N장 생성 시간이어야 함
- Rate limit(429)만 유일한 병목 → exponential backoff + retry
- 실 테스트에서 최적 병렬 수 결정 (계정 tier마다 다를 수 있음)

## Anti-Slop Fixes (Frontend Audit)

| 항목 | Before (슬롭) | After (수정) |
|------|--------------|-------------|
| 아이콘 | 이모지 (🖼️🎞️📸🎬📁) | Lucide React 아이콘 |
| 폰트 | Inter, system-ui | Pretendard + Inter fallback (CJK) |
| Accent 수 | 5색 (red, purple, lavender, pink, yellow) | 2색: red (#ff6b6b) + black (#111) |
| Preview | 랜덤 canvas 그림 | 실제 변환 결과 or skeleton |
| Copy | "AI Style Transfer for Sports Highlights" | "축구 클립을 크레용 GIF로 변환" 같은 구체 문구 |
| Spinner | generic spinner | skeleton placeholder or 구체 progress |
| 모바일 | Phase 4로 미룸 | Phase 1부터 최소 반응형 (1-column) |

## UX State Checklist (구현 시 참고)
- [ ] Onboarding: 샘플 이미지 체험 or 토큰 없이 데모
- [ ] Empty: Upload zone, Preview idle, History empty, Custom prompt empty
- [ ] Error: 토큰 만료, rate limit, moderation, 용량 초과, 타입 불일치, WASM 실패, 네트워크
- [ ] Loading: skeleton (Phase 1), progress bar + ETA (Phase 2+), cancel 버튼
- [ ] Upload: 파일 바꾸기/제거 버튼, 접근성 (keyboard, aria), 모바일 tap
- [ ] Token input: mask/reveal, 빈 입력 시 error 미노출, 저장 위치 설명
