'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react';

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';
const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;

export default function UploadZone({ file, onFile, mode, onDuration }: {
  file: File | null;
  onFile: (f: File | null) => void;
  mode: 'image' | 'frames' | 'single' | 'v2v';
  onDuration?: (d: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState(0);
  const acceptsVideo = mode !== 'image';
  const accept = acceptsVideo ? `${IMAGE_ACCEPT},${VIDEO_ACCEPT}` : IMAGE_ACCEPT;
  const maxSize = acceptsVideo ? VIDEO_MAX : IMAGE_MAX;

  useEffect(() => {
    if (!file || !file.type.startsWith('video/')) { setDuration(0); onDuration?.(0); return; }
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      onDuration?.(video.duration);
      URL.revokeObjectURL(url);
    };
    video.src = url;
  }, [file, onDuration]);

  const handleFile = useCallback((f: File) => {
    if (f.size > maxSize) { alert(`Max ${maxSize / 1024 / 1024}MB`); return; }
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (!isImage && !isVideo) { alert('Unsupported file type'); return; }
    if (isVideo && !acceptsVideo) { alert('Select a video mode first'); return; }
    onFile(f);
  }, [onFile, maxSize, acceptsVideo]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  if (file) {
    const isVideo = file.type.startsWith('video/');
    const Icon = isVideo ? Film : ImageIcon;
    return (
      <div className="border-3 border-[var(--border)] p-3.5 bg-[var(--surface)] flex items-center gap-3">
        <Icon size={32} strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-[13px] truncate">{file.name}</div>
          <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
            {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type.split('/')[1].toUpperCase()}
            {isVideo && duration > 0 && ` · ${duration.toFixed(1)}s`}
          </div>
        </div>
        <button className="neo-btn p-1.5" onClick={() => onFile(null)} aria-label="Remove file">
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
      <div className="text-sm font-extrabold">
        {acceptsVideo ? 'Drop video or image' : 'Drop image here'}
      </div>
      <div className="text-[10px] text-gray-500 font-semibold mt-1">
        {acceptsVideo ? 'MP4 · WebM · MOV · PNG · JPG — max 100MB' : 'PNG · JPG · WebP — max 10MB'}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
