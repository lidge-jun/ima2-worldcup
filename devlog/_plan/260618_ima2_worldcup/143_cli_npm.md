# 143 — CLI + npm Global Install (`ima2w serve`)

## Goal
GitHub에서 `npm i -g ima2-worldcup` → `ima2w serve` → 로컬 브라우저에서 앱 사용

## Reference
ima2-gen 패턴 그대로:
```bash
npm i -g ima2-worldcup
ima2w serve          # → http://localhost:3334
ima2w setup          # → OAuth 토큰 설정 (interactive)
ima2w --help
```

## Files: NEW
```
bin/ima2w.ts                — CLI entry point (#!/usr/bin/env node)
                              Subcommands: serve, setup, --help, --version
                              serve: Next.js standalone server 실행
                              setup: interactive OAuth token 설정 (inquirer)

bin/serve.ts                — startServer(port) 
                              Next.js standalone output → node server.js
                              Port: default 3334, --port flag
                              Auto-open browser

bin/setup.ts                — Interactive CLI:
                              1. "Codex OAuth token:" → paste → validate → save
                              2. "xAI/Grok token:" → paste → validate → save
                              Token 저장: ~/.ima2-worldcup/auth.json

lib/auth-local.ts           — 로컬 모드 전용 토큰 관리
                              Read/write ~/.ima2-worldcup/auth.json
                              API Route에서 로컬 파일 토큰 자동 사용
                              (Vercel 배포 시는 클라이언트 localStorage 사용)
```

## Files: MODIFY
```
package.json                — Add:
                              "bin": { "ima2w": "dist/bin/ima2w.js" }
                              scripts.build에 standalone output 추가

next.config.ts              — output: 'standalone' 추가
                              (Vercel은 자동 감지, npm은 standalone 필요)

app/api/generate/route.ts   — 토큰 소스 분기:
                              Vercel: 클라이언트 헤더에서 토큰 수신
                              Local: ~/.ima2-worldcup/auth.json에서 읽기
                              env: IMA2W_LOCAL=true 로 분기
```

## npm Publish
```bash
npm run build               # Next.js build + standalone
npm publish                 # → npmjs.com/package/ima2-worldcup
```

## Install Flow (사용자 관점)
```bash
npm i -g ima2-worldcup
ima2w setup
# → "Paste your Codex OAuth token:" ___
# → "Paste your xAI/Grok token (optional):" ___
# → ✓ Tokens saved to ~/.ima2-worldcup/auth.json

ima2w serve
# → 🌐 ima2-worldcup running at http://localhost:3334
# → (browser auto-opens)
```

## Done
- `npm i -g ima2-worldcup` → `ima2w serve` → 로컬에서 앱 사용 가능
- `ima2w setup` → 토큰 설정
- Vercel 배포와 로컬 CLI 모두 동일한 앱 코드 공유
