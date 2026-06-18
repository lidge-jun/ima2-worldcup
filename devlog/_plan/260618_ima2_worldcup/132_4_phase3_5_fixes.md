# Phase 3.5 — Bug Fixes + Auth UI + UX Polish

## Issues (사용자 피드백 260618 19:42)

### Bug 1: 큐가 새로고침 시 초기화됨
**현상**: 큐에 작업 추가 후 새로고침하면 사라짐
**원인**: `jobs` 상태가 React state에만 있음 (lib/store/queue.ts, app/page.tsx)
**해결**: 큐도 IndexedDB에 저장 (gallery와 같은 패턴). 단, File 객체는 IndexedDB에 직렬화 불가 → file의 b64를 저장하고, 복원 시 Blob→File 변환. 또는 pending/queued 작업만 localStorage에 메타데이터 저장하고 File은 재업로드 유도.
**추천**: pending 큐 메타데이터를 localStorage에 저장. 파일은 재업로드 필요하므로 "파일을 다시 선택하세요" 표시. 완료된 작업은 Gallery에 이미 저장됨.

### Bug 2: OAuth 설정 팝업이 ima2-gen 스타일이 아님
**현상**: 토큰 붙여넣기만 있음. ima2-gen은 Usage Quota + Rate Limits 바 + Switch Account 버튼 표시
**참조**: ima2-gen의 `/api/quota` 엔드포인트:
- Codex: `chatgpt.com/backend-api/wham/usage` → email, plan, 5h/7d windows (percent + resetsAt)
- Grok: `cli-chat-proxy.grok.com/v1/billing` + `/v1/user` → email, tier, monthly window, billing USD
**해결**: 
- 새 API route: `GET /api/quota` — Codex(~/.codex/auth.json → chatgpt.com/backend-api/wham/usage) + Grok(~/.progrok/auth.json → grok billing)
- AuthModal 리디자인: 할당량 바 표시, "Switch Account" 버튼 (기존 토큰 삭제 + 새 토큰 입력)
- 네오브루탈리즘 스타일 적용

### Bug 3: 에러 아닌데 Queue에 Error 표시 + 완료 후 Queue에 계속 남음
**현상**: 성공한 작업이 "Error" 표시, 완료된 작업이 Queue에서 사라지지 않음
**원인**: 
1. `processJob()` 결과를 `setJobs`로 업데이트할 때 `results` 변수 참조 타이밍 문제 (page.tsx ~136)
2. completed 작업 정리 로직 없음 — Queue에 무한 축적
**해결**:
1. processJob return 값을 정확히 반영하도록 수정
2. completed 작업은 5개까지만 Queue에 표시, 나머지는 Gallery에서 확인

### Bug 4: 생성 중 애니메이션이 정지됨
**현상**: SVG 애니메이션이 한번 재생 후 멈춤 (fill="freeze")
**원인**: GeneratingAnim.tsx의 SVG SMIL 애니메이션이 `fill="freeze"`로 설정 → 한번 실행 후 정지
**해결**: 
- CSS @keyframes 기반 무한 반복 애니메이션으로 교체
- 또는 SMIL에 `repeatCount="indefinite"` 추가
- 생성 완료 시점에 애니메이션 컴포넌트 언마운트

### UX 개선: 동영상 드래그앤드롭 시 자동 모드 전환
**현상**: 동영상을 첨부해도 Image 모드 유지 → 사용자가 수동으로 Frames→GIF 선택 필요
**해결**:
1. UploadZone에서 file 타입 감지: video/* → 자동으로 mode='frames' 전환
2. 비디오 파일 선택 시 Image 모드 비활성화 (이미지 파일이면 반대로 video 모드 비활성화)
3. ModeSelector에 file 타입 기반 자동 잠금: 비디오 업로드 시 Image 잠금, 이미지 업로드 시 Frames/V2V/1pic 잠금

## Files

### NEW
```
app/api/quota/route.ts       — Codex + Grok 할당량 조회 (ima2-gen 패턴)
```

### MODIFY
```
components/AuthModal.tsx     — 할당량 바 + Switch Account + 네오브루탈리즘
components/GeneratingAnim.tsx — CSS infinite animation (SMIL freeze 제거)
components/UploadZone.tsx    — 비디오 감지 → onModeChange 콜백
components/ModeSelector.tsx  — fileType prop → 자동 잠금
app/page.tsx                 — Bug 3 수정 (processJob 결과 반영), 큐 정리 로직, 자동 모드 전환
lib/store/queue.ts           — Bug 1: localStorage 기반 큐 영속화 (메타데이터만)
```

## QA Audit Findings (Frontend employee 260618 19:42)

### Bug 1 추가 발견
- `queue.ts:7` Job의 `file: File`은 직렬화 불가 → IndexedDB에 Blob 저장 or 메타데이터만 localStorage
- `gallery.ts:1-3` DB_VERSION=1에 queue store 추가하려면 버전 마이그레이션 필요
- Gallery 저장 시 gifBlob/videoUrl 누락 (`page.tsx:129-138`) → GIF/비디오 결과 완전 보존 안 됨
- `queue.ts:22` nextId가 reload 시 1로 리셋 (Date.now 포함이라 실 충돌 낮지만 정리 필요)

### Bug 2 추가 발견
- proxy online이면 Codex connect 버튼 숨겨짐 (`AuthStatus.tsx:37-49`) → 별도 로그인 진입점 없음
- ima2-gen의 Switch Account는 `/api/auth/switch` → 새 탭 device/login flow → 현재 없음
- `validate-token` API는 OpenAI API key 검증이라 OAuth quota 조회와 성격 다름

### Bug 3 추가 발견 (핵심)
- `page.tsx:119-145`: processJob 성공 후 갤러리 저장(makeThumbnail/saveToGallery)이 같은 .then() 체인
  → 저장 실패 시 .catch()가 성공 job을 error로 덮어씀
- `page.tsx:120` setJobs(done) → effect 재트리거 but `page.tsx:142` processingRef=false가 아직 미실행
  → 다음 queued job 처리 시작 안 될 수 있음
- `page.tsx:143-145` catch에서 setError/setPreviewState 호출 안 함 → Preview와 Queue 상태 불일치

### Bug 4 추가 발견
- 전체 SVG가 순차 등장형 one-shot → repeatCount만 추가하면 "등장 반복" 어색
  → CSS 기반 loop 배경(잔디 흔들림, 공 움직임) 별도 설계 필요

### UX 추가 발견
- `UploadZone.tsx:37` video 크기 체크가 IMAGE_MAX(10MB) 먼저 → 큰 비디오에 잘못된 에러
- UploadZone에 fileType 콜백 없음 → parent에서 자동 모드 전환 불가
- `page.tsx:272` canGenerate가 file type-mode 호환성 미검증 → incompatible pipeline 실행 가능

## Done Criteria
1. 새로고침 후 pending 큐 메타데이터 복원 (파일은 재선택 필요 알림)
2. AuthModal에 Codex/Grok 할당량 바 + Switch Account 표시
3. 성공한 작업이 Queue에서 Error 아닌 Done 표시 + 5개 초과 시 자동 정리
4. 생성 중 애니메이션 무한 반복
5. 동영상 드래그앤드롭 → 자동 Frames→GIF 모드 + Image 잠금
