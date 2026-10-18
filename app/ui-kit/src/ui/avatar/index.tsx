// Avatar — chữ cái/ảnh (antd: size 32 default, radius 4 (square) / circle, bg fill
// #f5f5f5? antd avatar default bg colorFillContent = rgba(0,0,0,0.06) — dùng bg-s3;
// text ink; icon trắng? antd icon = trắng trên bg accent? Default bg gray + icon ink).
import { useState, type ReactNode } from 'react';

export interface AvatarProps {
  /** Nội dung hiển thị khi không có src (chữ cái/initials) — fontSize scale theo size. */
  children?: ReactNode;
  /** Ảnh src — khi có render <img> (fade-in khi load xong). */
  src?: string;
  /** Alt của <img> — nên đặt tên người dùng. */
  alt?: string;
  /** Kích thước vuông px (antd default 32). */
  size?: number;
  /** circle (mặc định) | square (radius --r-2). */
  shape?: 'circle' | 'square';
  className?: string;
}

export function Avatar({ children, src, alt, size = 32, shape = 'circle', className }: AvatarProps) {
  const [loaded, setLoaded] = useState(false);
  // src fail (404/offline) → fallback về children/initials (antd onError fallback)
  const [failed, setFailed] = useState(false);
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
      {src && !failed ? (
        <img
          src={src}
          alt={alt ?? ''}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`size-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <span style={{ fontSize: size * 0.44 }}>{children}</span>
      )}
    </span>
  );
}
