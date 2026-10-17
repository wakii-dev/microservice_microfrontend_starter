// Avatar — chữ cái/ảnh (antd: size 32 default, radius 4 (square) / circle, bg fill
// #f5f5f5? antd avatar default bg colorFillContent = rgba(0,0,0,0.06) — dùng bg-s3;
// text ink; icon trắng? antd icon = trắng trên bg accent? Default bg gray + icon ink).
import type { ReactNode } from 'react';

export interface AvatarProps {
  children?: ReactNode;
  /** Ảnh src — khi có render <img>. */
  src?: string;
  alt?: string;
  size?: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export function Avatar({ children, src, alt, size = 32, shape = 'circle', className }: AvatarProps) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: shape === 'circle' ? '50%' : 'var(--r-2)',
    lineHeight: `${size}px`,
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-s3 text-body text-ink2${className ? ` ${className}` : ''}`}
      style={style}
    >
      {src ? (
        <img src={src} alt={alt ?? ''} className="size-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.44 }}>{children}</span>
      )}
    </span>
  );
}
