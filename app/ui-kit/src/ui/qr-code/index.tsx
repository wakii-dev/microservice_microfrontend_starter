// QRCode — antd parity (docs/parity-matrix.md Gap P1): SVG QR cho link thanh toán
// / chia sẻ. Thuật toán: qrcode-generator v1.4.4 (MIT, Kazuhiko Arase) vendored
// single-file không deps runtime — xem `qrcode-generator.vendor.ts`. Render SVG
// (sắc nét mọi size, không canvas blur). errorLevel L/M/Q/H (mặc định M như antd).
// Màu mặc định tokens-only: fg = var(--ink), bg = var(--c-s1) — tự cascade dark.
// Icon giữa (antd icon/logo) — CHƯA làm ở bản đầu (cần occlusion EC-safe): backlog.
// A11y: role="img" + aria-label theo value; SVG không dùng id/defs → không thể
// trùng id khi 2 QR cùng trang (lỗi phổ biến của QR svg dùng gradient/clipPath).
import { useMemo } from 'react';
import { makeQrMatrix, matrixToPath, type QrErrorLevel } from './qrcode-core.js';

export interface QRCodeProps {
  /** Nội dung mã hoá (URL, token thanh toán…). */
  value: string;
  /** Kích thước cạnh (px) — mặc định 160 như antd. */
  size?: number;
  /** Mức sửa lỗi — L ≈7% · M ≈15% (default) · Q ≈25% · H ≈30%. */
  errorLevel?: QrErrorLevel;
  /** Màu nền (CSS color/token) — mặc định var(--c-s1). */
  bgColor?: string;
  /** Màu module (CSS color/token) — mặc định var(--ink). */
  fgColor?: string;
  /** aria-label override — mặc định `QR code for <value>`. */
  title?: string;
  className?: string;
}

const QUIET_ZONE = 2; // module viền trắng quanh mã (đủ để scanner tách khỏi nền)

export function QRCode({
  value,
  size = 160,
  errorLevel = 'M',
  bgColor = 'var(--c-s1)',
  fgColor = 'var(--ink)',
  title,
  className,
}: QRCodeProps) {
  const { path, count } = useMemo(
    () => {
      const m = makeQrMatrix(value, errorLevel);
      return { path: matrixToPath(m), count: m.count };
    },
    [value, errorLevel],
  );
  const side = count + QUIET_ZONE * 2;

  return (
    <svg
      role="img"
      aria-label={title ?? `QR code for ${value}`}
      width={size}
      height={size}
      viewBox={`0 0 ${side} ${side}`}
      className={className}
      style={{ display: 'block' }}
    >
      <rect width={side} height={side} fill={bgColor} />
      {/* shape-rendering crispEdges — module không răng cưa half-pixel */}
      <path d={path} fill={fgColor} transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`} shapeRendering="crispEdges" />
    </svg>
  );
}
