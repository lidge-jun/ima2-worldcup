# 142 — Responsive + History + Share + Open-Source Release

## Files: NEW
```
components/History.tsx       — localStorage 기반 최근 변환 리스트 (최대 20개)
                              썸네일 + 스타일 태그 + 타임스탬프
                              클릭 → 결과 다시 표시

components/ShareButton.tsx   — Web Share API (모바일) + 클립보드 복사 (데스크톱)
                              "Share" → 이미지 or GIF를 공유
                              Twitter/X 공유 링크 생성

README.md                    — 프로젝트 소개, 스크린샷, 설치, 사용법, 라이선스
LICENSE                      — MIT
```

## Files: MODIFY
```
app/globals.css             — 반응형 breakpoints:
                              ≤768px: 1-column, 스택 레이아웃
                              설정 패널 → 접을 수 있는 drawer

components/DownloadBar.tsx  — Retry + Share 활성화

app/layout.tsx              — OG image + SEO meta tags
```

## Deploy
```bash
# GitHub public repo
gh repo create lidge-jun/ima2-worldcup --public --source=.
git push -u origin main

# Vercel custom domain
vercel domains add ima2-worldcup.lidge.dev
```

## Done (= Phase 4 Complete = v1.0)
- 커스텀 도메인 접근 가능
- GitHub 퍼블릭 레포 + README + 스크린샷
- 모바일 반응형
- Share 기능 작동
- History에서 이전 결과 확인 가능
