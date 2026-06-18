# Phase 3.2 — Gallery + Queue + Generation Animation

## Goal
ima2 스타일 3-panel 레이아웃 + 생성 중 애니메이션

## Scope
- 왼쪽 Gallery 사이드바: 생성 완료된 이미지/GIF 썸네일 그리드, 스타일 태그 + 시간
- 오른쪽 Queue 사이드바: 현재 생성 중 + 대기 + 완료 목록, 프로그레스 바
- 생성 중 SVG 애니메이션: 크레용 선 그리기 + 요소 순서 등장 + pulse
- 메인 영역: Upload/Settings + Preview (기존 2-col → 1-col로 압축)
- 레이아웃: Gallery(220px) | Main(flex) | Queue(240px)

## Mockup Reference
`mockups/phase3_2-gallery-queue.html` (diagram-html로 확인됨)

## Files
- NEW: components/Gallery.tsx, components/QueuePanel.tsx, components/GeneratingAnimation.tsx
- MODIFY: app/page.tsx (3-panel grid), app/globals.css (sidebar styles)
- NEW: lib/store.ts (gallery + queue state management)
