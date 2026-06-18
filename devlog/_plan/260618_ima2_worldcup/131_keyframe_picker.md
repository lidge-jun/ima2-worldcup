# 131 — Video → Single Image (Keyframe Picker)

## Files: NEW
```
lib/ffmpeg/keyframes.ts     — extractKeyframes(videoFile, count=5) → Frame[]
                              균등 분할: duration/count 간격으로 5장 추출
                              각 프레임에 timestamp 포함

components/KeyframePicker.tsx — 5개 썸네일 그리드 (1행)
                              각 썸네일: 타임스탬프 라벨 (0:02, 0:04...)
                              클릭 → selected 상태 (보라 보더 + shadow)
                              선택된 프레임 → 기존 Image i2i 파이프라인으로 전달

components/ModeSelector.tsx — MODIFY: Video→1pic 잠금 해제
```

## Files: MODIFY
```
app/page.tsx                — Video→1pic 모드:
                              1. 비디오 업로드 → extractKeyframes(5)
                              2. KeyframePicker 표시 (Settings 패널 내)
                              3. 사용자가 프레임 선택
                              4. Generate → 해당 프레임 1장만 i2i
                              5. Preview에 결과 이미지 표시
                              6. Download PNG
```

## Done
- 비디오 업로드 → 5개 키프레임 썸네일 → 1개 선택 → 스타일 변환 → 다운로드
