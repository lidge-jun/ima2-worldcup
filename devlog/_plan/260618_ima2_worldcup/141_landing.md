# 141 — Landing Page + Before/After

## Files: NEW
```
app/(landing)/page.tsx      — 랜딩 페이지 (Route Group)
                              섹션: Hero → Before/After → Features (4 cards) → CTA → Footer
                              "Try Now" → /app (메인 도구 페이지)

components/landing/Hero.tsx     — accent-1 배경, 큰 로고, 서브 텍스트, 2 CTA 버튼
components/landing/BeforeAfter.tsx — 원본 vs 크레용 비교 (canvas 렌더링 or 실제 스크린샷)
components/landing/Features.tsx   — 4 모드 카드 그리드
components/landing/Footer.tsx     — GitHub + MIT + 버전
components/landing/Nav.tsx        — 고정 상단 네비게이션
```

## Done
- 랜딩 페이지에서 "Try Now" → 앱 도구로 이동
- Before/After 데모 표시
- 4개 기능 카드
