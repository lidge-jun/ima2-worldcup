# 113 — OAuth Token Management

## Files: NEW
```
lib/auth.ts                 — Token storage (localStorage), clear
                              interface AuthState { codexToken?: string; grokToken?: string; }
                              saveCodexToken(token) / getCodexToken() / clearTokens()

app/api/validate-token/route.ts — POST { token } → OpenAI GET /v1/models → { valid: boolean }
                              서버 사이드 검증 (CORS 회피, M2 fix)

components/AuthModal.tsx    — Modal: "Paste your Codex OAuth token"
                              Input field + "How to get token" 링크
                              Token 붙여넣기 → validate → save → close
                              xAI token도 같은 모달, 탭 전환

components/AuthStatus.tsx   — 헤더 우측: 로그인 안됨="Sign In" 버튼
                              로그인됨="jun@codex ✓" 뱃지
                              클릭 → AuthModal 열기

app/page.tsx                — MODIFY: AuthStatus를 Header에 삽입
                              인증 안됨 → Preview 영역에 "Sign In to Generate" 프롬프트
                              인증됨 → Generate 버튼 활성
```

## Token Flow (Phase 1 — paste only)
```
1. User clicks "Sign In"
2. AuthModal opens — "Paste Codex Token" tab
3. User pastes token from Codex CLI: `codex auth token`
4. Token saved to localStorage (key: ima2wc_codex_token)
5. Token validated: POST /api/validate-token → server-side GET OpenAI /v1/models (CORS-safe)
6. Success → badge shows "codex ✓", modal closes
```

## Security
- Token은 localStorage에만 저장 (서버 전송 없음, API Route에서 프록시)
- API Route가 클라이언트 토큰을 받아 OpenAI에 전달
- 서버 로그에 토큰 기록 금지

## Done
- "Sign In" → 토큰 붙여넣기 → 인증 뱃지 표시
- 토큰 없으면 Generate 비활성 + Preview에 로그인 프롬프트
- 페이지 새로고침해도 토큰 유지 (localStorage)
