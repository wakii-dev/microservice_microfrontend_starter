// Watermark — overlay chữ lặp phủ lên nội dung (antd-like) dùng SVG data-URI làm
// backgroundImage tile repeat (KHÔNG deps mới; canvas.toDataURL không chạy được trong
// jsdom nên chọn nhánh SVG data-URI). Overlay pointer-events-none + aria-hidden —
// nội dung children vẫn bấm/select bình thường.
// Màu mặc định resolve token --ink3 qua getComputedStyle (fallback = giá trị --ink3
// light cho môi trường không cascade token, vd jsdom). Đổi theme (data-bp-theme) →
// re-bake tile qua MutationObserver. Font-family mặc định 'sans-serif' — SVG data-URI
// không đọc được CSS var, consumer override qua prop font khi cần đúng stack.
import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface WatermarkFont {
  /** Cỡ chữ tile (px). Mặc định 16. */
  fontSize?: number;
  /** Độ đậm. Mặc định 'normal'. */
  fontWeight?: 'normal' | 'bold' | number;
  /** Font family (mặc định 'sans-serif' — xem ghi chú đầu file). */
  fontFamily?: string;
  /** Kiểu chữ. Mặc định 'normal'. */
  fontStyle?: 'normal' | 'italic' | 'oblique';
}

/** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định (consumer append). */
export interface WatermarkClassNames {
  /** Span gốc bọc children (relative block). */
  root?: string;
  /** Span overlay tile watermark (aria-hidden). */
  overlay?: string;
}

export interface WatermarkProps {
  /** Nội dung được phủ watermark. */
  children: ReactNode;
  /** Chữ watermark — 1 dòng hoặc mảng nhiều dòng. */
  content: string | string[];
  /** Khoảng hở giữa các tile [ngang, dọc] (px). Mặc định [100, 100] (antd). */
  gap?: [number, number];
  /** Độ lệch lưới tile so với gốc [ngang, dọc] (px). Mặc định gap/2 (antd). */
  offset?: [number, number];
  /** Tọa độ đặt overlay (số → px) — kèm width/height để thu overlay lại. */
  left?: number | string;
  /** Tọa độ đặt overlay (số → px) — kèm width/height để thu overlay lại. */
  top?: number | string;
  /** Chiều rộng overlay (px khi số) — chỉ có ý nghĩa khi truyền left/top. */
  width?: number | string;
  /** Chiều cao overlay (px khi số) — chỉ có ý nghĩa khi truyền left/top. */
  height?: number | string;
  /** z-index overlay (antd mặc định 9 — dưới thang --z-* overlay). */
  zIndex?: number;
  /** Góc nghiêng chữ (độ). Mặc định -22 (antd). */
  rotate?: number;
  /** Độ mờ overlay 0–1. Mặc định 1 (mức mờ nằm ở màu token --ink3). */
  opacity?: number;
  /** Kiểu chữ tile — xem WatermarkFont. */
  font?: WatermarkFont;
  /** Màu chữ tile — override token (resolve --ink3 từ scope consumer khi không truyền). */
  fontColor?: string;
  className?: string;
  /** Style dán lên container bao children. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: WatermarkClassNames;
}

/** Escape nội dung text đưa vào SVG (data-URI không được vỡ markup). */
function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/** Ước lượng độ rộng dòng — CJK đếm 1em, ký tự còn lại ~0.6em (không dùng canvas:
 * jsdom không có getContext('2d'), méo vài px không thấy vì gap mặc định 100px). */
function estimateTextWidth(text: string, fontSize: number): number {
  const units = Array.from(text).reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e7f ? 1 : 0.6), 0);
  return Math.ceil(units * fontSize);
}

/** Dựng tile SVG xoay sẵn + encode data-URI — tile repeat thẳng, chữ xoay trong tile (kiểu antd). */
function buildTileUrl(opts: {
  lines: string[];
  gap: [number, number];
  rotate: number;
  fontSize: number;
  fontWeight: WatermarkFont['fontWeight'];
  fontFamily: string;
  fontStyle: WatermarkFont['fontStyle'];
  color: string;
}): string {
  const { lines, gap, rotate, fontSize, fontWeight, fontFamily, fontStyle, color } = opts;
  const lineHeight = Math.ceil(fontSize * 1.2);
  const blockW = Math.max(...lines.map((l) => estimateTextWidth(l, fontSize)));
  const blockH = lines.length * lineHeight;
  const rad = (Math.abs(rotate) * Math.PI) / 180;
  // Tile đủ lớn để chữ xoay quanh tâm không tràn mép (bounding box xoay + gap)
  const tileW = Math.ceil(blockW * Math.cos(rad) + blockH * Math.sin(rad)) + gap[0];
  const tileH = Math.ceil(blockW * Math.sin(rad) + blockH * Math.cos(rad)) + gap[1];
  const cx = tileW / 2;
  const cy = tileH / 2;
  const textTags = lines
    .map((line, i) => {
      const y = cy - ((lines.length - 1) / 2) * lineHeight + i * lineHeight;
      return `<text x="${cx}" y="${y}" fill="${escapeXml(color)}" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${fontWeight}" font-style="${fontStyle}" text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`;
    })
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${tileH}" viewBox="0 0 ${tileW} ${tileH}"><g transform="rotate(${rotate} ${cx} ${cy})">${textTags}</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function Watermark(props: WatermarkProps) {
  const {
    children,
    content,
    gap = [100, 100],
    offset,
    left,
    top,
    width,
    height,
    zIndex = 9,
    rotate = -22,
    opacity = 1,
    font,
    fontColor,
    className,
    style,
  } = props;
  const slots = props.classNames;
  const rootRef = useRef<HTMLSpanElement>(null);
  // Màu tile bake sẵn vào SVG — resolve token --ink3 trong scope consumer; fallback
  // là giá trị --ink3 light (môi trường không cascade token, vd jsdom).
  const [tileColor, setTileColor] = useState('rgba(0, 0, 0, 0.45)');

  useEffect(() => {
    if (fontColor) return; // consumer override — khỏi resolve token
    const sync = () => {
      const el = rootRef.current;
      if (!el) return;
      const v = getComputedStyle(el).getPropertyValue('--ink3').trim();
      if (v) setTileColor(v); // đổi theme data-bp-theme → re-bake tile màu mới
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bp-theme'] });
    return () => mo.disconnect();
  }, [fontColor]);

  const lines = useMemo(() => (Array.isArray(content) ? content : [content]), [content]);

  const tileUrl = useMemo(
    () =>
      buildTileUrl({
        lines,
        gap,
        rotate,
        fontSize: font?.fontSize ?? 16,
        fontWeight: font?.fontWeight ?? 'normal',
        fontFamily: font?.fontFamily ?? 'sans-serif',
        fontStyle: font?.fontStyle ?? 'normal',
        color: fontColor ?? tileColor,
      }),
    [lines, gap, rotate, font, fontColor, tileColor],
  );

  // Overlay mặc định phủ kín container (inset-0); truyền left/top (và width/height)
  // → neo góc riêng kiểu antd (watermark vùng chọn thay vì toàn khối).
  const positioned = left !== undefined || top !== undefined;
  const overlayStyle: CSSProperties = {
    zIndex,
    opacity,
    backgroundImage: `url("${tileUrl}")`,
    backgroundRepeat: 'repeat',
    backgroundPosition: offset ? `${offset[0]}px ${offset[1]}px` : `${gap[0] / 2}px ${gap[1] / 2}px`,
  };
  if (positioned) {
    overlayStyle.left = left;
    overlayStyle.top = top;
    if (width !== undefined) overlayStyle.width = width;
    if (height !== undefined) overlayStyle.height = height;
  }

  return (
    <span ref={rootRef} className={classNames('relative block', slots?.root, className)} style={style}>
      {children}
      <span
        aria-hidden="true"
        className={classNames('pointer-events-none absolute overflow-hidden', positioned ? '' : 'inset-0', slots?.overlay)}
        style={overlayStyle}
      />
    </span>
  );
}
