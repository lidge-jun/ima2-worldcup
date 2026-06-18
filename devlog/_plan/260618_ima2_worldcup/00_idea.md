# ima2-worldcup — Idea & Research

## Concept
스포츠 하이라이트(월드컵 골 장면 등)를 AI 화풍 변환하여 저작권 회피 가능한 아트로 재생성.
치지직(Chzzk) 등 스트리밍 플랫폼에서 움짤/클립 공유 시 저작권 이슈 해결.

## Core Modes
1. **Image → Image**: 이미지 1장 → 선택한 화풍으로 변환
2. **Video → Frame-by-frame GIF/MP4**: 동영상 → FPS 설정(0.33~3fps) → 프레임별 병렬 변환 → GIF/MP4 조립
3. **Video → Single Image**: 동영상에서 키프레임 1장 추출 → 변환
4. **Video → Video (Grok V2V)**: Grok의 video-to-video API로 전체 영상 직접 변환

## Technical Decisions (Resolved)
- **Stack**: Next.js (App Router) + Tailwind + Vercel
- **Image Model**: gpt-5.4-mini (non-thinking) — fast, parallel i2i like ima2-gen
- **Video Processing**: Browser WASM ffmpeg (사용자 리소스, 서버 비용 없음)
- **Auth**: 사용자 자신의 Codex OAuth + xAI OAuth
- **의존성**: ima2-gen 코드 뜯어서 독립 구현 (npm dependency 없음)
- **배포**: Vercel + 커스텀 도메인 + GitHub 오픈소스
- **라이선스**: MIT

## Style Presets
- crayon (크레용/색연필) — 메인 타겟
- watercolor (수채화)
- oil (유화)
- sketch (연필 스케치)
- anime (애니메이션)
- custom (사용자 프롬프트)

## Success Criteria
- 10초 축구 하이라이트 MP4 → 크레용 화풍 GIF, ~3분 이내 (병렬 생성)
- Vercel에 배포, 누구나 접속 가능
- GitHub 오픈소스 공개
