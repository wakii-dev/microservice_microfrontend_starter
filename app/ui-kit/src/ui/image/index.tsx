// Image — ảnh có preview (antd lite): click ảnh → overlay full-giữa, ESC/click
// đóng. Portal body; alt bắt buộc a11y.
// A11y (batch ⑫ worker C): img onClick → role=button + tabIndex + Enter/Space
// (trước đây chỉ click chuột mở preview).
// A11y (batch F 2026-10-18): role=dialog + focus trap (useFocusTrap — pattern
// Modal: mở → focus overlay, Tab vòng trong, đóng → trả focus về thumbnail).
import classNames from 'classnames';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface UiImageClassNames {
  /** <img> thumbnail (role=button mở preview). */
  root?: string;
  /** Div overlay preview (portal body, role=dialog). */
  preview?: string;
  /** <img> lớn trong overlay. */
  previewImage?: string;
}

export interface ImageProps {
  /** Đường dẫn ảnh (bắt buộc). */
  src: string;
  /** Alt bắt buộc a11y — cũng là aria-label overlay preview. */
  alt: string;
  /** Bề rộng ảnh (number px | CSS string). */
  width?: number | string;
  className?: string;
  /** Inline style — passthrough lên <img> thumbnail. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: UiImageClassNames;
}

export function UiImage(props: ImageProps) {
  const { src, alt, width, className, style } = props;
  const slots = props.classNames;
  const [preview, setPreview] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, preview);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  const openPreview = () => setPreview(true);
  const onImgKey = (e: ReactKeyboardEvent<HTMLImageElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPreview();
    }
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        width={width}
        style={style}
        onLoad={() => setLoaded(true)}
        role="button"
        tabIndex={0}
        aria-label={`${alt} — phóng to`}
        className={classNames(
          'cursor-zoom-in rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-opacity duration-200 hover:opacity-90 active:opacity-80',
          loaded ? 'opacity-100' : 'opacity-0',
          slots?.root,
          className,
        )}
        onClick={openPreview}
        onKeyDown={onImgKey}
      />
      {preview &&
        createPortal(
          <div
            ref={overlayRef}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            tabIndex={-1}
            className={classNames('fixed inset-0 z-[var(--z-modal)] flex cursor-zoom-out items-center justify-center bg-scrim-4 p-8 outline-none animate-[bp-fade-in_var(--motion-fast)_var(--ease-enter)]', slots?.preview)}
            onClick={() => setPreview(false)}
            data-testid="image-preview"
          >
            <img src={src} alt={alt} className={classNames('max-h-full max-w-full rounded-lg', slots?.previewImage)} />
          </div>,
          document.body,
        )}
    </>
  );
}
