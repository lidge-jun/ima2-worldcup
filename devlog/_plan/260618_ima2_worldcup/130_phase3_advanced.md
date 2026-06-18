# Phase 3 — Advanced Modes

## Goal
Video→Single Image + Grok V2V 통합, 4개 모드 전부 활성

## Scope
- Video→Single Image: 비디오에서 "최고의" 키프레임 1장 추출 → 스타일 변환
- Grok V2V: xAI API로 비디오 전체를 직접 스타일 변환
- 모든 4개 모드 UI 잠금 해제
- xAI OAuth 토큰 활용 (Phase 1에서 구현한 인증 재사용)

## UI State (Phase 3 완료 시)
- Upload 패널: 이미지 + 비디오 모두 지원
- Mode: 4개 전부 활성 ✅ (잠금 아이콘 제거)
- Video→1pic: 업로드 → 썸네일 그리드(5개) → 사용자가 키프레임 선택 → 스타일 변환
- Grok V2V: 업로드 → 스타일 선택 → "Grok로 변환 중..." 프로그레스 → 영상 다운로드
- Preview: 이미지/GIF/비디오 타입에 따라 적절한 플레이어 표시
- Grok V2V 모드에서는 FPS 슬라이더 대신 "Duration" 표시

## Technical Tasks
1. 키프레임 추출 알고리즘 (장면 변화 감지 or 균등 분할)
2. 썸네일 그리드 UI (5프레임 미리보기, 클릭 선택)
3. xAI Grok V2V API 연동 (비디오 업로드 → 스타일 비디오 수신)
4. Grok V2V 진행률 폴링 (xAI API가 비동기일 경우)
5. 비디오 플레이어 컴포넌트 (결과 MP4 재생)
6. 모드별 UI 분기 (FPS/Duration/None)

## Done Criteria
- Video→1pic: 10초 MP4에서 키프레임 1장 골라서 스타일 변환
- Grok V2V: 10초 MP4 → Grok으로 전체 영상 크레용 스타일 변환
- 4개 모드 전부 작동

## Mockup
`mockups/phase3-advanced.html`
