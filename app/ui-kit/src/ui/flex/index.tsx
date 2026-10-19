// Flex — wrapper bố cục nhẹ kiểu antd v5: <Flex vertical gap justify align wrap>.
// Gap dùng thang Space của thư viện (small 8 / middle 16 / large 24 | number px)
// để nhất quán nội bộ; justify/align nhận giá trị CSS thô.
import type { ReactNode } from 'react';

export type FlexGap = 'small' | 'middle' | 'large' | number;
export type FlexJustify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export interface FlexProps {
  /** Xếp dọc (flex-col) thay vì ngang (mặc định ngang). */
  vertical?: boolean;
  /** Khoảng cách giữa item: thang Space hoặc px tuỳ ý (mặc định small = 8). */
  gap?: FlexGap;
  /** Phân bố item (justify-content). */
  justify?: FlexJustify;
  /** Căn item (align-items). */
  align?: FlexAlign;
  /** Cho item xuống hàng khi tràn. */
  wrap?: boolean;
  children: ReactNode;
  className?: string;
}

const GAP: Record<Exclude<FlexGap, number>, number> = { small: 8, middle: 16, large: 24 };

export function Flex({
  vertical = false,
  gap = 'small',
  justify,
  align,
  wrap = false,
  children,
  className,
}: FlexProps) {
  const gapPx = typeof gap === 'number' ? gap : GAP[gap];
  return (
    <div
      className={`flex${vertical ? ' flex-col' : ' flex-row'}${wrap ? ' flex-wrap' : ''}${className ? ` ${className}` : ''}`}
      style={{ gap: gapPx, justifyContent: justify, alignItems: align }}
    >
      {children}
    </div>
  );
}
