# Phase 0 — Design Direction

## Design Ism: Neobrutalism

3개 목업 비교 후 확정 (2026-06-18).

### Design Tokens
```css
/* Colors */
--bg: #fffbe6;           /* 크림 배경 */
--surface: #fff;         /* 카드/패널 내부 */
--text: #111;            /* 메인 텍스트 */
--border: #111;          /* 3px solid */
--shadow: #111;          /* box-shadow offset */
--accent-1: #ff6b6b;     /* 헤더, CTA 배경 */
--accent-2: #6c5ce7;     /* Generate 버튼, 주요 액션 */
--accent-3: #a29bfe;     /* 선택 상태 (mode) */
--accent-4: #fd79a8;     /* 선택 상태 (style chip) */
--accent-5: #ffeaa7;     /* hover 배경 */

/* Typography */
font-family: 'Inter', system-ui, sans-serif;
font-weight: 800-900;   /* 대부분 굵게 */
text-transform: uppercase; /* 라벨 */
letter-spacing: 1px;     /* 라벨 */

/* Borders & Shadows */
border: 3px solid var(--border);
box-shadow: 6px 6px 0 var(--shadow);  /* 패널 */
box-shadow: 3px 3px 0 var(--shadow);  /* 버튼/칩 */
border-radius: 0;        /* 라운딩 없음 */

/* Hover/Active */
:hover { transform: translate(1px,1px); box-shadow: 2px 2px 0 var(--shadow); }
```

### Key UI Elements
- **Header**: accent-1 배경, 두꺼운 보더, 로고 역상(검정 배경+컬러 텍스트)
- **Panels**: 흰 배경, 검정 보더 3px, shadow 6px 6px
- **Upload zone**: dashed 보더, hover시 노랑 배경
- **Mode cards**: 2x2 그리드, 선택시 보라색 배경
- **Style chips**: pill 없이 사각형, 선택시 핑크 배경
- **Generate 버튼**: 보라 배경, 흰 텍스트, uppercase, shadow 6px
- **Progress bar**: 사선 줄무늬(candy stripe)

### Mockup Reference
`mockups/a-neobrutalism.html`

### Not in Scope (Phase 0)
- 다크 모드 (네오브루탈리즘은 라이트가 정석)
- 반응형 모바일 (Phase 4에서)
- 애니메이션/트랜지션 (최소한만)
