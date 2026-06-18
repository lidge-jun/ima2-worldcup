# Phase 3.4 — Gallery Restyle (다른 스타일로 재변환)

## Goal
갤러리에서 이전 결과를 선택해 다른 스타일로 재변환하는 기능.

## Scope
- GalleryPreview에 "Restyle" 버튼 추가
- 클릭 → 원본 이미지(IndexedDB에 저장된)를 새 스타일로 Queue에 추가
- 스타일 드롭다운/칩으로 변경할 스타일 선택
- 기존 generate 파이프라인 재사용

## Dependency
- 3.2 Gallery + IndexedDB (원본 이미지 저장 필요)
- 3.2 Queue (새 job 추가)

## Files
```
MODIFY: components/GalleryPreview.tsx — "Restyle" 버튼 + 스타일 선택 UI
MODIFY: lib/store/gallery.ts — GalleryItem에 originalB64 필드 추가 (원본 보존)
```

## Done Criteria
- 갤러리에서 crayon 결과 클릭 → "Restyle" → watercolor 선택 → Queue에 추가 → 변환 완료
