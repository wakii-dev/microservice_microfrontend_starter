// QRCode — antd parity (docs/parity-matrix.md Gap P1): SVG QR cho link thanh toán
// / chia sẻ. Thuật toán: qrcode-generator v1.4.4 (MIT, Kazuhiko Arase) vendored
// single-file không deps runtime — xem `qrcode-generator.vendor.ts`. Render SVG
// (sắc nét mọi size, không canvas blur). errorLevel L/M/Q/H (mặc định M như antd).
// Màu mặc định tokens-only: fg = var(--ink), bg = var(--c-s1) — tự cascade dark.
// Icon giữa (antd excavate mode — R10): `icon?: ReactNode` → khung nền punch-out
// (absolute, cùng màu bgColor) đè vùng trung tâm + icon flex center; matrix GIỮ
// NGUYÊN (scanner đọc vòng ngoài nhờ error correction) — khi có icon mà user không
// truyền errorLevel thì tự nâng lên **H** (~30% sửa lỗi, đủ bù che khuất như antd).
// A11y: role="img" + aria-label theo value; SVG không dùng id/defs → không thể
// trùng id khi 2 QR cùng trang (lỗi phổ biến của QR svg dùng gradient/clipPath).
import classNames from 'classnames';
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { makeQrMatrix, matrixToPath, type QrErrorLevel } from './qrcode-core.js';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface QRCodeClassNames {
  /** Span gốc bọc QR (nơi className prop cũng dính). */
  root?: string;
  /** <svg> render mã. */
  code?: string;
  /** Span punch-out khung icon giữa — chỉ render khi có icon. */
  icon?: string;
}

export interface QRCodeProps {
  /** Nội dung mã hoá (URL, token thanh toán…). */
  value: string;
  /** Kích thước cạnh (px) — mặc định 160 như antd. */
  size?: number;
  /** Mức sửa lỗi — L ≈7% · M ≈15% (default) · Q ≈25% · H ≈30%. Có `icon` mà không
   * truyền → tự nâng H (excavate giữa cần nhiều dư thừa hơn). */
  errorLevel?: QrErrorLevel;
  /** Màu nền (CSS color/token) — mặc định var(--c-s1). */
  bgColor?: string;
  /** Màu module (CSS color/token) — mặc định var(--ink). */
  fgColor?: string;
  /** Icon giữa kiểu antd (excavate mode) — khung nền punch-out + node flex center.
   * Khuyên dùng icon đơn giản ≥24px (logo/Icon bộ kit). Decorative: aria-hidden. */
  icon?: ReactNode;
  /** aria-label override — mặc định `QR code for <value>`. */
  title?: string;
  className?: string;
  /** Inline style — passthrough lên span gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: QRCodeClassNames;
}

const QUIET_ZONE = 2; // module viền trắng quanh mã (đủ để scanner tách khỏi nền)

export function QRCode(props: QRCodeProps) {
  const {
    value,
    size = 160,
    errorLevel,
    bgColor = 'var(--c-s1)',
    fgColor = 'var(--ink)',
    icon,
    title,
    className,
    style,
  } = props;
  const slots = props.classNames;
  // icon mà không truyền level → H (antd excavate parity); có level → respect user
  const level: QrErrorLevel = icon && errorLevel === undefined ? 'H' : errorLevel ?? 'M';
  const { path, count } = useMemo(
    () => {
      const m = makeQrMatrix(value, level);
      return { path: matrixToPath(m), count: m.count };
    },
    [value, level],
  );
  const side = count + QUIET_ZONE * 2;

  return (
    <span
      className={classNames('relative inline-block', slots?.root, className)}
      style={{ width: size, height: size, ...style }}
    >
      <svg
        role="img"
        aria-label={title ?? `QR code for ${value}`}
        width={size}
        height={size}
        viewBox={`0 0 ${side} ${side}`}
        className={slots?.code}
        style={{ display: 'block' }}
      >
        <rect width={side} height={side} fill={bgColor} />
        {/* shape-rendering crispEdges — module không răng cưa half-pixel */}
        <path d={path} fill={fgColor} transform={`translate(${QUIET_ZONE} ${QUIET_ZONE})`} shapeRendering="crispEdges" />
      </svg>
      {icon && (
        // Punch-out khung giữa: nền = bgColor (đồng bộ " excavate"), ~1/4 cạnh,
        // radius nhẹ, icon nằm bên trong — decorative (aria-hidden).
        <span
          aria-hidden="true"
          className={classNames('absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-md p-[4%]', slots?.icon)}
          style={{ width: '25%', height: '25%', background: bgColor, color: fgColor }}
        >
          {icon}
        </span>
      )}
    </span>
  );
}
