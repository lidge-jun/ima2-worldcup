# 112 — Upload Zone + Settings Panel

## Files: NEW
```
components/UploadZone.tsx   — Drag-and-drop + click, image only (video disabled label)
                              State: empty → file selected (name + size + preview thumb)
                              Accepts: PNG, JPG, WebP, max 10MB
                              Output: File object + base64 string

components/ModeSelector.tsx — 2x2 grid, Image=active, rest 3개 🔒 locked
                              Props: activeMode, onModeChange
                              Locked modes show lock icon, cursor:not-allowed

components/StylePicker.tsx  — 6 chips: Crayon(default), Watercolor, Oil, Sketch, Anime, Custom
                              Custom 선택 시 textarea 표시
                              Props: activeStyle, onStyleChange

components/FpsSlider.tsx    — range input, hidden in Image mode
                              값: [⅓, ½, 1, 1.5, 2, 2.5, 3] fps
                              Phase 2에서 활성화
```

## State Shape (app/page.tsx)
```typescript
const [file, setFile] = useState<File | null>(null);
const [fileB64, setFileB64] = useState<string>('');
const [mode, setMode] = useState<'image' | 'frames' | 'single' | 'v2v'>('image');
const [style, setStyle] = useState<string>('crayon');
const [customPrompt, setCustomPrompt] = useState('');
const [fps, setFps] = useState(1);
```

## Done
- 이미지 드래그앤드롭 → 파일명/크기/썸네일 표시
- Mode 4개 중 Image만 클릭 가능
- Style 6개 전환 + Custom textarea
- FPS 숨김 (Image 모드)
