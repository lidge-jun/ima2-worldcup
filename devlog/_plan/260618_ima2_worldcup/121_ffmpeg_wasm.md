# 121 — ffmpeg.wasm Integration

## Files: NEW
```
lib/ffmpeg/worker.ts        — FFmpeg WASM 초기화 + 로드
                              SharedArrayBuffer 필요 → COOP/COEP 헤더
                              Lazy load: 첫 비디오 업로드 시 로드

lib/ffmpeg/extract.ts       — extractFrames(videoFile, fps) → Frame[]
                              Frame = { index: number, timestamp: number, blob: Blob, b64: string }
                              ffmpeg -i input.mp4 -vf "fps=<fps>" frame_%04d.png

lib/ffmpeg/assemble.ts      — assembleGif(frames: Blob[], fps) → Blob
                              ffmpeg -f image2 -r <fps> -i frame_%04d.png output.gif
                              assembleMp4(frames, fps) → Blob (선택)
```

## Files: MODIFY
```
vercel.json                 — Add COOP/COEP headers:
                              Cross-Origin-Opener-Policy: same-origin
                              Cross-Origin-Embedder-Policy: require-corp

components/UploadZone.tsx   — Accept video: MP4, WebM, MOV (max 100MB)
                              비디오 선택 시 메타데이터 표시 (duration, resolution)
                              "→ N frames @ Xfps" 계산 표시
```

## Dependencies
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

## Done
- 비디오 업로드 → ffmpeg.wasm 로드 → 프레임 추출 → Frame[] 반환
- Frame 배열 → GIF 조립 → Blob 다운로드
- SharedArrayBuffer 동작 확인 (COOP/COEP 헤더)
