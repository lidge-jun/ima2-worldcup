'use client';

import { useEffect, useState } from 'react';
import { listGallery, type GalleryItem } from '@/lib/store/gallery';

export default function Gallery({ onSelect, selectedId, overlay, onClose }: {
  onSelect: (item: GalleryItem) => void;
  selectedId?: string;
  overlay?: boolean;
  onClose?: () => void;
}) {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    listGallery().then(setItems).catch(() => {});
  }, []);

  const refresh = () => listGallery().then(setItems).catch(() => {});

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('gallery-updated', handler);
    return () => window.removeEventListener('gallery-updated', handler);
  }, []);

  if (overlay) {
    return (
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}>
        <aside className="absolute left-0 top-0 bottom-0 w-[260px] border-r-3 border-[var(--border)] bg-[var(--surface)] flex flex-col shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="neo-panel-head flex justify-between text-[11px]">
            <span>Gallery</span>
            <button onClick={onClose} className="text-[var(--accent)] font-black">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <div className="text-center text-[11px] font-semibold text-gray-400 py-8">Generated images appear here</div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {items.map(item => (
                  <button key={item.id} onClick={() => onSelect(item)}
                    className={`border-2 border-[var(--border)] relative aspect-[16/10] overflow-hidden ${selectedId === item.id ? 'border-[var(--accent)] shadow-[2px_2px_0_var(--shadow)]' : ''}`}>
                    {item.thumbB64 && <img src={`data:image/jpeg;base64,${item.thumbB64}`} alt={`${item.style} result`} className="w-full h-full object-cover" />}
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[7px] font-bold px-1 py-0.5 flex justify-between">
                      <span>{item.style}</span><span>{formatAge(item.timestamp)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <aside className="border-r-3 border-[var(--border)] bg-[var(--surface)] flex flex-col h-full">
      <div className="neo-panel-head flex justify-between text-[11px]">
        <span>Gallery</span>
        <span className="text-[var(--accent)]">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5">
        {items.length === 0 ? (
          <div className="text-center text-[11px] font-semibold text-gray-400 py-8">
            Generated images appear here
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`border-2 border-[var(--border)] relative aspect-[16/10] overflow-hidden ${
                  selectedId === item.id ? 'border-[var(--accent)] shadow-[2px_2px_0_var(--shadow)]' : ''
                }`}
              >
                {item.thumbB64 && (
                  <img
                    src={`data:image/jpeg;base64,${item.thumbB64}`}
                    alt={`${item.style} result`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[7px] font-bold px-1 py-0.5 flex justify-between">
                  <span>{item.style}</span>
                  <span>{formatAge(item.timestamp)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

function formatAge(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}
