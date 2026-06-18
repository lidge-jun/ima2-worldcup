# Phase 2 Build Plan — Video Pipeline (audit-fixed)

## Part 1: 요약

비디오를 업로드하면 브라우저 ffmpeg.wasm으로 프레임을 추출하고, 최대 3개씩 병렬로 GPT에 보내 스타일 변환한 뒤, GIF로 조립해서 다운로드합니다. 서버 비용 없음.

## Audit Fixes (7항목)
1. ffmpeg core: CDN + toBlobURL() (로컬 @ffmpeg/core 불필요)
2. COOP/COEP: next.config.ts만 사용 (vercel.json 미생성)
3. Concurrency: default 3 with p-limit, 429시 backoff
4. generateBatch: getStylePrompt() resolve 후 generateImage() 호출
5. Video base64: 비디오는 FileReader 안 거침, File 직접 ffmpeg FS에 전달
6. PreviewPanel: resultKind 분기 (image: b64, gif: blob URL)
7. Browser guard: crossOriginIsolated 체크 + 에러 UI

## Part 2: File Map

### Step 1 — ffmpeg.wasm (121)

NEW files:
```
lib/ffmpeg/types.ts      — Frame = { index, timestamp, blob, b64 }
                           StyledFrame = Frame & { styledB64?, status, error? }
lib/ffmpeg/worker.ts     — getFFmpeg(): singleton, lazy CDN load via toBlobURL()
                           crossOriginIsolated 체크, 에러 시 throw
lib/ffmpeg/extract.ts    — extractFrames(file: File, fps: number) → Frame[]
                           file → ffmpeg FS writeFile → -vf fps=N → readFile each png → b64
lib/ffmpeg/assemble.ts   — assembleGif(styledBlobs: Blob[], fps: number) → Blob
                           writeFile each → ffmpeg -f image2 → readFile output.gif → Blob
```

NEW files:
```
components/FpsSlider.tsx  — range 0.33~3, 예상 프레임 수 표시, Props: fps, onFps, duration
```

MODIFY files:
```
components/UploadZone.tsx — Props에 mode 추가
                           mode='frames': accept += video/mp4,video/webm,video/quicktime, max 100MB
                           비디오 선택 시: <video> element로 duration 읽기, "→ N frames" 표시
                           비디오는 FileReader 안 거침 (b64 변환 없음)

app/page.tsx              — fileB64 생성 useEffect: mode==='image'일 때만 실행
                           새 상태: videoDuration, 비디오 메타 읽기
```

### Step 2 — Parallel Batch + Progress (122)

NEW files:
```
lib/generate-batch.ts    — generateBatch(frames, style, customPrompt, token, onProgress)
                           내부: getStylePrompt(style, customPrompt) → prompt 결정
                           p-limit(3) 사용, 429시 exponential backoff (최대 3 retry)
                           onProgress(done, total, frameIndex)

components/FrameStrip.tsx — 가로 스크롤, 60x40 썸네일
                           status: pending(회색) / done(accent) / error(빨강)

components/ProgressBar.tsx — candy stripe bar + ETA
                           Props: current, total, label
```

MODIFY files:
```
components/ModeSelector.tsx — frames locked: false

components/PreviewPanel.tsx — Props 확장:
                             resultKind: 'image' | 'gif'
                             resultB64: string (image)
                             gifUrl: string (gif blob URL)
                             frames?: StyledFrame[]
                             progress?: { current, total }
                             → gif 모드: <img src={gifUrl}> 자동재생
                             → + FrameStrip + ProgressBar 조건부 렌더

app/page.tsx               — frames 모드 Generate 핸들러:
                             1. extractFrames(file, fps)
                             2. setFrames → FrameStrip 표시
                             3. generateBatch(frames, style, customPrompt, token, onProgress)
                             4. assembleGif(styledBlobs, fps) → gifBlob
                             5. URL.createObjectURL(gifBlob) → gifUrl
                             6. PreviewPanel에 gifUrl 전달
                             Download: gif blob → a.href download
```

### Dependencies
```
npm install @ffmpeg/ffmpeg @ffmpeg/util
```
(@ffmpeg/core는 CDN 로드, 별도 설치 불필요)

## Done Criteria
1. 비디오 업로드 → FPS 선택 → "→ N frames" 표시
2. Generate → p-limit(3) 병렬 i2i → FrameStrip 실시간 업데이트
3. 완료 → GIF 미리보기 (자동재생) → Download GIF
4. crossOriginIsolated 미지원 시 에러 메시지
5. `npx tsc --noEmit` clean
6. `npm run build` pass
