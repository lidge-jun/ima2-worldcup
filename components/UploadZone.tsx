'use client';

import { useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

const ACCEPT = 'image/png,image/jpeg,image/webp';
const MAX_SIZE = 10 * 1024 * 1024;

export default function UploadZone({ file, onFile }: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_SIZE) { alert('Max 10MB'); return; }
    if (!f.type.startsWith('image/')) { alert('Images only (Phase 2 adds video)'); return; }
    onFile(f);
  }, [onFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (file) {
    return (
      <div className="border-3 border-[var(--border)] p-3.5 bg-[var(--surface)] flex items-center gap-3">
        <ImageIcon size={32} strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[13px] truncate">{file.name}</div>
          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
            {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type.split('/')[1].toUpperCase()}
          </div>
        </div>
        <button
          className="neo-btn p-1.5"
          onClick={() => onFile(null)}
          aria-label="Remove file"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full border-3 border-dashed border-[var(--border)] p-10 text-center cursor-pointer bg-[var(--surface)] hover:bg-[var(--hover)] transition-colors"
      onClick={() => inputRef.current?.click()}
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
    >
      <Upload size={36} className="mx-auto mb-2 opacity-60" />
      <div className="text-sm font-extrabold">Drop image here</div>
      <div className="text-[10px] text-gray-500 font-semibold mt-1">
        PNG · JPG · WebP — max 10MB
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </button>
  );
}
