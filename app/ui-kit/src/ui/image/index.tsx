// Image — ảnh có preview (antd lite): click ảnh → overlay full-giữa, ESC/click
// đóng. Portal body; alt bắt buộc a11y.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ImageProps {
  src: string;
  alt: string;
  width?: number | string;
  className?: string;
}

export function UiImage({ src, alt, width, className }: ImageProps) {
  const [preview, setPreview] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        width={width}
        onLoad={() => setLoaded(true)}
        className={`cursor-zoom-in rounded-2 transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}${className ? ` ${className}` : ''}`}
        onClick={() => setPreview(true)}
      />
      {preview &&
        createPortal(
          <div
            className="fixed inset-0 z-[var(--z-modal)] flex cursor-zoom-out items-center justify-center bg-black/80 p-8 animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)]"
            onClick={() => setPreview(false)}
            data-testid="image-preview"
          >
            <img src={src} alt={alt} className="max-h-full max-w-full rounded-2" />
          </div>,
          document.body,
        )}
    </>
  );
}
