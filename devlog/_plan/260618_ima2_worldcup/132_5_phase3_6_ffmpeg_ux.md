# Phase 3.6 — FFmpeg Rewrite + Video UX + Dev Tooling

**Date**: 260618 21:00–24:00 (3시간 세션)
**Commits**: cd454d9 → 3587344 (11 commits)

## Summary

Phase 3.5에서 발견된 FFmpeg 로딩 실패 + Queue/Download/GIF 버그를 전부 수정하고,
Frames→GIF 모드를 Frames→MP4로 전환, FPS 슬라이더 개선, dev 스크립트 통합.

## Changes

### 1. FFmpeg Blob Worker (cd454d9)
**문제**: `worker.js`의 dynamic `import(_coreURL)`를 Next.js 16 Turbopack이 가로채서
"Cannot find module as expression is too dynamic" 에러
**해결**: `lib/ffmpeg/worker.ts` 완전 재작성. 자체 blob URL module worker 생성:
- `fetch()` → blob URL로 ffmpeg-core.js, ffmpeg-core.wasm 로드
- inline worker 코드 (static import 없음) → Turbopack 완전 우회
- `FFmpegAPI` 타입 인터페이스 (writeFile, readFile, deleteFile, exec)
- @ffmpeg/ffmpeg npm 패키지 미사용 (직접 Emscripten 모듈 제어)

### 2. Queue Done-Item Auto-Removal (cd454d9)
**문제**: `useEffect` cleanup이 매 `jobs` 변경마다 타이머를 clear/reset → 타이머 미발화
**해결**: `useRef<Map>` 기반 타이머 관리. job별 1회 타이머, re-render에 영향 없음.
error job에도 `completedAt` 추가.

### 3. Download UUID Filenames (707af88)
**문제**: Chrome이 detached `<a>` 태그의 `download` 속성 무시 → blob URL UUID를 파일명으로 사용
**해결**: `document.body.appendChild(a)` 후 click.

### 4. GIF Looping (707af88)
**문제**: ffmpeg GIF 기본값 = 1회 재생
**해결**: `-loop 0` 추가.

### 5. Queue "Error" Label (938dd56)
**문제**: `status === 'generating'` + `progress === undefined` → ternary 마지막 분기로 빠짐
**해결**: `generating` 전용 분기 추가.

### 6. Dev Script (642fa02, f3dab42)
- `scripts/dev.mjs`: Next.js + openai-oauth proxy 동시 실행, Ctrl+C 정리
- `IMA2WC_PORT` env var 사용 (jaw `PORT=3462` 충돌 방지)
- 기본 포트: Next.js :3477, proxy :10531

### 7. Favicon + Frame Scaling (d7ef2ae)
- `app/icon.svg`: 빨간 배경 + 검정 테두리 + bold "W" (neobrutalist)
- `extract.ts`, `keyframes.ts`: `scale='min(1024,iw)':'-1':flags=lanczos`
  (2988x1686 → 1024px 축소, API 500 방지)

### 8. MP4 Output + GIF Fix (9be34f9)
- `assembleVideo()`: libx264 + yuv420p + faststart → MP4
- `assembleGif()`: two-pass palette (single-pass split 필터가 wasm에서 1프레임만 출력)
- frames 모드 기본 출력: GIF → MP4 전환

### 9. FPS Slider (9c9e4ff, 3587344)
- 스텝: 1/5s, 1/3s, 1/2s, 1, 2, 3, 4, 5
- sub-1 값은 레이블 표시 (1/5s, 1/3s, 1/2s)

### 10. fetchFile 제거 (extract.ts, keyframes.ts)
- `@ffmpeg/util`의 `fetchFile` → `new Uint8Array(await file.arrayBuffer())`
- npm 패키지 의존성 축소

## Files Changed
- `lib/ffmpeg/worker.ts` — 완전 재작성 (blob worker)
- `lib/ffmpeg/assemble.ts` — assembleVideo 추가, assembleGif two-pass
- `lib/ffmpeg/extract.ts` — scale filter, fetchFile 제거
- `lib/ffmpeg/keyframes.ts` — scale filter, fetchFile 제거
- `app/page.tsx` — MP4 출력, ref-based 타이머, error completedAt
- `components/QueuePanel.tsx` — generating 분기
- `components/FpsSlider.tsx` — 1/5s~5 스텝
- `components/PreviewPanel.tsx` — (변경 없음, video/gif 분기 기존 로직)
- `app/icon.svg` — NEW (favicon)
- `scripts/dev.mjs` — NEW (dev runner)
- `package.json` — dev 스크립트 변경
