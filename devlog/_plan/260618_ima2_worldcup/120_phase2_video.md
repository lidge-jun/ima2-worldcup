# Phase 2 — Video Pipeline

## Goal
ffmpeg.wasm + 프레임 추출 + 병렬 i2i 배치 생성 + GIF/MP4 조립

## Scope
- ffmpeg.wasm 브라우저 통합 (클라이언트 사이드)
- 비디오 업로드 지원 (MP4, WebM, MOV)
- FPS 설정 UI 활성화 (0.33~3 fps)
- 프레임 추출: 비디오 → N개 프레임 이미지
- 병렬 배치 생성: N개 프레임 동시에 gpt-5.4-mini i2i
- 진행률 UI: "Frame 3/10 — crayon style..." + progress bar (candy stripe)
- GIF 조립: 스타일된 프레임 → animated GIF (ffmpeg.wasm)
- MP4 조립: 스타일된 프레임 → MP4 (ffmpeg.wasm, 선택 옵션)
- Frames→GIF 모드 잠금 해제

## UI State (Phase 2 완료 시)
- Upload 패널: 이미지 + 비디오 모두 지원
- Mode: Image ✅ + Frames→GIF ✅, 나머지 2개 잠금(🔒)
- FPS 슬라이더: Frames→GIF 모드 선택 시 표시
- Preview: 프레임별 진행률 + 최종 GIF 미리보기 (자동재생)
- Download: GIF / MP4 선택 다운로드
- 비디오 업로드 시 파일 정보 표시 (길이, 해상도, 예상 프레임 수)

## Technical Tasks
1. `@ffmpeg/ffmpeg` + `@ffmpeg/util` 설치, SharedArrayBuffer 설정
2. Vercel 헤더 설정 (COOP/COEP for SharedArrayBuffer)
3. 비디오 → 프레임 추출 함수 (configurable FPS)
4. 병렬 생성 큐: 동시 N개 (기본 3 병렬), 프레임별 콜백
5. 프레임 결과 → GIF 조립 (ffmpeg.wasm)
6. 프레임 결과 → MP4 조립 (ffmpeg.wasm, 선택)
7. 진행률 컴포넌트: 프레임 카운터 + candy stripe bar + 예상 시간
8. 비디오 메타데이터 읽기 (duration, resolution, fps)

## Done Criteria
- 10초 축구 하이라이트 MP4 → 1fps → 10 프레임 → 병렬 생성 → 크레용 GIF (~3분 이내)
- 진행률이 실시간으로 업데이트
- GIF 다운로드 가능

## Mockup
`mockups/phase2-video.html`
