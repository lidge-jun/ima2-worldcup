'use client';

import { useState } from 'react';
import { X, Download, RefreshCw, Palette } from 'lucide-react';
import type { GalleryItem } from '@/lib/store/gallery';

const RESTYLE_OPTIONS = ['crayon', 'watercolor', 'oil', 'sketch', 'anime'];

export default function GalleryPreview({ item, onClose, onRegenerate, onRestyle }: {
  item: GalleryItem;
  onClose: () => void;
  onRegenerate: (item: GalleryItem) => void;
  onRestyle: (item: GalleryItem, newStyle: string) => void;
}) {
  const [showRestyle, setShowRestyle] = useState(false);
  const otherStyles = RESTYLE_OPTIONS.filter(s => s !== item.style);

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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="neo-panel w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="neo-panel-head flex items-center justify-between text-[11px] flex-shrink-0">
          <span>Gallery — {item.style} · {formatAge(item.timestamp)}</span>
          <button onClick={onClose}><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* Before / After — side by side, full width */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
            <div>
              <div className="text-[9px] font-extrabold uppercase text-gray-400 text-center mb-1.5">Original</div>
              {item.originalB64 && (
                <img src={`data:image/png;base64,${item.originalB64}`} alt="Original" className="w-full border-3 border-[var(--border)]" />
              )}
            </div>
            <div className="text-2xl font-black mt-12">→</div>
            <div>
              <div className="text-[9px] font-extrabold uppercase text-gray-400 text-center mb-1.5 capitalize">{item.style}</div>
              {item.resultB64 && (
                <img src={`data:image/png;base64,${item.resultB64}`} alt="Styled" className="w-full border-3 border-[var(--border)]" />
              )}
              {item.gifBlob && (
                <img src={URL.createObjectURL(item.gifBlob)} alt="Styled GIF" className="w-full border-3 border-[var(--border)]" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button onClick={handleDownload} className="neo-btn neo-btn-accent flex-1 text-center flex items-center justify-center gap-1.5 py-2.5 text-[12px]">
              <Download size={14} /> Download
            </button>
            <button onClick={() => onRegenerate(item)} className="neo-btn flex-1 text-center flex items-center justify-center gap-1.5 py-2.5 text-[12px]" style={{ background: 'var(--hover)' }}>
              <RefreshCw size={14} /> Regenerate
            </button>
            <button onClick={() => setShowRestyle(!showRestyle)} className="neo-btn flex-1 text-center flex items-center justify-center gap-1.5 py-2.5 text-[12px]">
              <Palette size={14} /> Restyle
            </button>
          </div>

          {showRestyle && (
            <div className="mt-3 border-3 border-[var(--border)] p-3">
              <div className="text-[10px] font-extrabold uppercase text-gray-500 mb-2">Choose new style</div>
              <div className="flex flex-wrap gap-2">
                {otherStyles.map(s => (
                  <button
                    key={s}
                    onClick={() => { onRestyle(item, s); setShowRestyle(false); }}
                    className="neo-btn text-[11px] py-2 px-4 capitalize hover:bg-[var(--accent)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
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
