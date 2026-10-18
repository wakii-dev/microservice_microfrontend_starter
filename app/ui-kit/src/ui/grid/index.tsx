// Grid — layout 24-col kiểu antd: <Row gutter={[8, 8]}> + <Col span={12} md={8}>.
// Mechanic antd: Row flex + negative margin nửa gutter ngang, Col padding nửa gutter;
// gutter dọc chảy qua rowGap trên Row (cùng hiệu ứng antd, không cần padding-top col).
// Responsive: resolve mobile-first (xs→xl) qua useMediaQuery (matchMedia) — antd
// responsiveObserve cũng chạy matchMedia. Breakpoint dùng thang Tailwind v4 đang
// active trong repo (sm 640 / md 768 / lg 1024 / xl 1280) — tokens.css không có
// token --screen nên KHÔNG tự chế thang mới.
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';

export type GridBreakpoint = 'sm' | 'md' | 'lg' | 'xl';

/** Trùng thang breakpoint mặc định của Tailwind v4 (theme.css). */
const BREAKPOINTS: Record<GridBreakpoint, number> = { sm: 640, md: 768, lg: 1024, xl: 1280 };

/** Gutter Row đang chảy xuống Col qua context (padding nửa gutter ngang). */
interface GutterValue {
  h: number;
  v: number;
}
const GutterContext = createContext<GutterValue>({ h: 0, v: 0 });

export type RowJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
export type RowAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export interface RowProps {
  /** Khoảng cách giữa col: số (ngang) hoặc [ngang, dọc] px (antd gutter). */
  gutter?: number | [number, number];
  /** Phân bố col theo chiều ngang (justify-content). */
  justify?: RowJustify;
  /** Căn col theo chiều dọc (align-items). */
  align?: RowAlign;
  /** Cho col xuống hàng khi tràn 24 — mặc định bật như antd. */
  wrap?: boolean;
  children: ReactNode;
  className?: string;
}

export function Row({ gutter, justify, align, wrap = true, children, className }: RowProps) {
  const [h, v] = Array.isArray(gutter) ? gutter : gutter != null ? [gutter, 0] : [0, 0];
  return (
    <GutterContext.Provider value={{ h, v }}>
      <div
        className={`flex${wrap ? ' flex-wrap' : ' flex-nowrap'}${className ? ` ${className}` : ''}`}
        style={{
          marginLeft: h ? -(h / 2) : undefined,
          marginRight: h ? -(h / 2) : undefined,
          rowGap: v || undefined,
          justifyContent: justify,
          alignItems: align,
        }}
      >
        {children}
      </div>
    </GutterContext.Provider>
  );
}

export interface ColProps {
  /** Chiếm n/24 bề ngang (1–24) — bậc base khi không có breakpoint nào match. */
  span?: number;
  /** Span theo breakpoint (mobile-first: bậc match cao nhất thắng, kế thừa bậc dưới — giống antd). */
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  children?: ReactNode;
  className?: string;
}

/** Clamp span về 0–24 rồi đổi ra width % (flex-basis auto → ăn width). */
function spanWidth(span: number | undefined): string | undefined {
  if (span == null) return undefined;
  const n = Math.min(24, Math.max(0, span));
  return `${(n / 24) * 100}%`;
}

export function Col({ span, xs, sm, md, lg, xl, children, className }: ColProps) {
  const { h } = useContext(GutterContext);
  const smOn = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
  const mdOn = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const lgOn = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const xlOn = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
  // Cascade mobile-first: bậc cao match thì ghi đè, không match giữ nguyên bậc dưới.
  let eff: number | undefined = xs ?? span;
  if (smOn) eff = sm ?? eff;
  if (mdOn) eff = md ?? eff;
  if (lgOn) eff = lg ?? eff;
  if (xlOn) eff = xl ?? eff;

  const style: CSSProperties = { flex: '0 0 auto' };
  const width = spanWidth(eff);
  if (width !== undefined) style.width = width;
  if (h) {
    style.paddingLeft = h / 2;
    style.paddingRight = h / 2;
  }
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
