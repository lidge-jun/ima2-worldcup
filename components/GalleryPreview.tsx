'use client';

import { X, Download, RefreshCw } from 'lucide-react';
import type { GalleryItem } from '@/lib/store/gallery';

export default function GalleryPreview({ item, onClose, onRegenerate }: {
  item: GalleryItem;
  onClose: () => void;
  onRegenerate: (item: GalleryItem) => void;
}) {
  const handleDownload = () => {
    const a = document.createElement('a');
    if (item.gifBlob) {
      a.href = URL.createObjectURL(item.gifBlob);
      a.download = `ima2wc-${item.style}-${item.id}.gif`;
    } else if (item.resultB64) {
      a.href = `data:image/png;base64,${item.resultB64}`;
      a.download = `ima2wc-${item.style}-${item.id}.png`;
    }
    a.click();
  };

  return (
    <div className="absolute inset-0 bg-[var(--surface)] z-10 flex flex-col">
      <div className="neo-panel-head flex items-center justify-between text-[11px]">
        <span>Gallery — {item.style} · {formatAge(item.timestamp)}</span>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {/* Before / After compare */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
          <div>
            <div className="text-[8px] font-extrabold uppercase text-gray-400 text-center mb-1">Original</div>
            {item.originalB64 && (
              <img src={`data:image/png;base64,${item.originalB64}`} alt="Original" className="w-full border-2 border-[var(--border)]" />
            )}
          </div>
          <div className="text-lg font-black">→</div>
          <div>
            <div className="text-[8px] font-extrabold uppercase text-gray-400 text-center mb-1">{item.style}</div>
            {item.resultB64 && (
              <img src={`data:image/png;base64,${item.resultB64}`} alt="Styled" className="w-full border-2 border-[var(--border)]" />
            )}
            {item.gifBlob && (
              <img src={URL.createObjectURL(item.gifBlob)} alt="Styled GIF" className="w-full border-2 border-[var(--border)]" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 mt-3">
          <button onClick={handleDownload} className="neo-btn neo-btn-accent flex-1 text-center flex items-center justify-center gap-1 text-[10px]">
            <Download size={12} /> Download
          </button>
          <button onClick={() => onRegenerate(item)} className="neo-btn flex-1 text-center flex items-center justify-center gap-1 text-[10px]" style={{ background: 'var(--hover)' }}>
            <RefreshCw size={12} /> Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAge(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}
