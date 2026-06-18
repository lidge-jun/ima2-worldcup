# Phase 3.7 — UX Fixes + Responsive + Parallel Jobs

## Scope (5 items)

### Fix 1: Gallery 클릭 버그 (C1)
**파일**: `app/page.tsx:142`
**문제**: `setSelectedGallery(null)` 이 job 시작 시 무조건 호출 → generating 중 갤러리 클릭해도 다음 렌더에서 null 복구
**해결**: line 142 삭제. gallery 선택은 job processing과 독립.

### Fix 2: GalleryPreview 다운로드 DOM 붙이기 (C0)
**파일**: `components/GalleryPreview.tsx:18-28`
**문제**: detached `<a>` → UUID 파일명 (page.tsx에서 고친 것과 동일 버그)
**해결**: `document.body.appendChild(a)` + click + `removeChild`

### Fix 3: h-screen → 100dvh (C0)
**파일**: `app/page.tsx:314`
**문제**: `h-screen` = `100vh` → iOS Safari 주소창 변동 시 레이아웃 점프
**해결**: `h-screen` → `min-h-[100dvh]`

### Fix 4: 모바일 반응형 (C2)
**파일**: `app/page.tsx`, `components/Gallery.tsx`, `components/QueuePanel.tsx`
**전략**:
- Desktop (≥1024px): 현재 3컬럼 유지
- Tablet/Mobile (<1024px): Gallery/Queue는 overlay drawer, Main만 전체폭
- `useIsMobile` hook 추가 (matchMedia 800px)
- Gallery/Queue 토글 버튼을 Header에 추가
- Gallery: 좌측 slide-in overlay
- Queue: 우측 slide-in overlay

**Layout 변경**:
```
// 현재
grid-cols-[200px_1fr_220px]

// 변경
lg:grid-cols-[200px_1fr_220px] grid-cols-[1fr]
```
- Gallery/Queue는 `<1024px`에서 `fixed` overlay로 전환
- 토글 버튼: Gallery (사진 아이콘) + Queue (목록 아이콘) → Header에 추가

### Fix 5: 병렬 job 처리 (C2)
**파일**: `app/page.tsx`, `lib/ffmpeg/extract.ts`, `lib/ffmpeg/assemble.ts`, `lib/ffmpeg/keyframes.ts`
**전략**:
- `processingRef` 단일 boolean → 제거
- `getActiveJob` (단일) → 여러 job 동시 generating 허용
- `processJob`은 job.id를 preview에 연결 (가장 최근 시작 job의 결과를 preview에 표시)
- FFmpeg FS 충돌 방지: `extractFrames`, `assembleVideo`, `assembleGif`에서 파일명에 job.id prefix 추가
  - `frame_%04d.png` → `{jobId}_frame_%04d.png`
  - `styled_%04d.png` → `{jobId}_styled_%04d.png`
  - `output.mp4` → `{jobId}_output.mp4`
- Queue effect: queued job 전부 동시 시작 (processingRef 삭제)
- 각 job의 progress는 독립적으로 업데이트

**Preview 전략**:
- `activeJobId` state 추가 — 가장 최근 시작된 job
- `processJob` 시작 시 `setActiveJobId(job.id)`
- preview state (resultB64, videoUrl 등)는 activeJobId인 job만 업데이트
- Gallery/Queue에서 다른 job 클릭하면 해당 job의 결과를 preview에 표시

## File Changes

| File | Action |
|------|--------|
| `app/page.tsx` | MODIFY — 병렬 queue, responsive layout, gallery fix, dvh |
| `components/Gallery.tsx` | MODIFY — overlay mode prop |
| `components/QueuePanel.tsx` | MODIFY — overlay mode prop |
| `components/GalleryPreview.tsx` | MODIFY — download DOM fix |
| `lib/ffmpeg/extract.ts` | MODIFY — prefix 파일명 |
| `lib/ffmpeg/assemble.ts` | MODIFY — prefix 파일명 |
| `lib/ffmpeg/keyframes.ts` | MODIFY — prefix 파일명 |
| `hooks/useIsMobile.ts` | NEW — matchMedia hook |
