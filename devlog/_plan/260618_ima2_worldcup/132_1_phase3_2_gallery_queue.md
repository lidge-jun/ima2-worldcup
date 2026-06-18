# Phase 3.2 — Gallery + Queue + Generation Animation

## ima2-gen 참조 분석
- `eventBus.ts`: pub/sub로 job별 SSE 이벤트 멀티플렉싱
- `inflight.js`: SQLite에 job 상태 추적 (queued → streaming → done)
- `ssePublish.ts`: job 이벤트 발행 래퍼

ima2-gen은 서버 기반(SQLite)이지만, ima2-worldcup은 **브라우저 앱**이므로:
- Job Queue → React state (메모리)
- Gallery 영속 → IndexedDB (이미지 바이너리 포함)
- SSE → 이미 구현됨 (generate.ts의 parseSSEForImage)

## Architecture Decision (dev-architecture 스킬 기반)

```
Presentation Layer (components/)
  ├── Gallery.tsx         — IndexedDB 읽기, 썸네일 그리드
  ├── QueuePanel.tsx      — 현재 큐 상태 표시
  ├── GeneratingAnim.tsx  — SVG 크레용 그리기 애니메이션
  └── GalleryPreview.tsx  — 갤러리 아이템 클릭 → 확대 보기 + 재생성/스타일변경

Application Layer (lib/)
  ├── store/queue.ts      — Job 큐 상태 관리 (add, start, complete, error)
  │                         Job = { id, file, style, mode, status, resultB64?, gifUrl? }
  ├── store/gallery.ts    — IndexedDB CRUD (save, list, delete, getById)
  │                         GalleryItem = { id, timestamp, style, mode, thumbB64, fullB64?, gifBlob? }
  └── generate.ts         — 기존 (변경 없음)

Domain (lib/ffmpeg/, lib/grok/)
  └── 기존 (변경 없음)
```

**의존 방향**: Gallery/Queue components → store → (IndexedDB / React state)
**금지**: store가 components를 import, components 간 직접 import (page.tsx가 조합)

## Scope

### 3.2a — Queue + 멀티 Job
- `lib/store/queue.ts`: Job 타입, addJob(), startNext(), completeJob()
- `components/QueuePanel.tsx`: 큐 리스트 (generating/pending/completed)
- `app/page.tsx`: "Add to Queue" 버튼, 큐에서 순차 처리

### 3.2b — Gallery + IndexedDB
- `lib/store/gallery.ts`: IndexedDB 래퍼 (idb-keyval 또는 raw API)
- `components/Gallery.tsx`: 왼쪽 사이드바, 썸네일 그리드
- Job 완료 시 자동으로 Gallery에 저장

### 3.2c — Generation Animation
- `components/GeneratingAnim.tsx`: SVG 기반 크레용 그리기 애니메이션
- Preview 영역에서 generating 상태일 때 표시

### 3.2d — Gallery Preview + 재생성 (→ 3.4로 분리 가능)
- `components/GalleryPreview.tsx`: 갤러리 아이템 클릭 → 확대
- "같은 설정으로 다시" 버튼 (원본+스타일 설정 복원)
- "다른 스타일로" 버튼 (→ 3.4로 분리)

## Files Summary
```
NEW:  lib/store/queue.ts
NEW:  lib/store/gallery.ts  
NEW:  components/Gallery.tsx
NEW:  components/QueuePanel.tsx
NEW:  components/GeneratingAnim.tsx
NEW:  components/GalleryPreview.tsx (또는 3.4로)
MODIFY: app/page.tsx (3-panel grid, queue integration)
MODIFY: app/globals.css (sidebar styles)
```

## Done Criteria
1. 여러 이미지/비디오를 Queue에 추가 가능
2. 순차 처리 (1개 끝나면 다음 시작)
3. 완료된 결과가 Gallery에 자동 저장 (IndexedDB)
4. Gallery 클릭 → Preview에 표시 + 재생성 버튼
5. 생성 중 SVG 크레용 애니메이션 표시
