// VirtualScroll — render ảo kiểu PrimeReact VirtualScroller (fixed itemSize):
// chỉ mount window [first, last) + buffer 2 phía, phần còn lại là spacer cao
// items*itemSize; window dịch bằng transform translateY(first*itemSize) (GPU,
// không đụng layout). onScrollEnd bắn 1 lần mỗi lần chạm đáy (reset khi cuộn
// lên) — phục vụ load-more. KHÔNG deps mới, scroll event thuần.
// ⚠️ Chỉ hỗ trợ row cao CỐ ĐỊNH (itemSize) — dynamic height cần đo thật, backlog riêng.
import classNames from 'classnames';
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode, type UIEvent } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface VirtualScrollClassNames {
  /** Div viewport cuộn. */
  root?: string;
}

export interface VirtualScrollProps<T> {
  items: T[];
  /** Chiều cao cố định mỗi row (px) — nguồn tính offset/slice. */
  itemSize: number;
  /** Chiều cao viewport cuộn: số px hoặc CSS string ('100%' — đo clientHeight sau mount). */
  height?: number | string;
  renderItem: (item: T, index: number) => ReactNode;
  /** Số row render thêm mỗi phía ngoài window (mặc định 5). */
  buffer?: number;
  /** Bắn khi cuộn tới đáy viewport (mỗi lần chạm đáy, reset khi rời đáy). */
  onScrollEnd?: () => void;
  className?: string;
  /** Inline style — merge SAU height (consumer override được). */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: VirtualScrollClassNames;
}

export function VirtualScroll<T>(props: VirtualScrollProps<T>) {
  const {
    items,
    itemSize,
    height = 320,
    renderItem,
    buffer = 5,
    onScrollEnd,
    className,
    style,
  } = props;
  const slots = props.classNames;
  const size = Math.max(1, itemSize); // chặn chia 0 → NaN index
  const [scrollTop, setScrollTop] = useState(0);
  // height số dùng luôn; height CSS string → đo clientHeight sau mount
  const [clientH, setClientH] = useState(typeof height === 'number' ? height : 0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (typeof height === 'number') return;
    setClientH(viewportRef.current?.clientHeight ?? 0);
  }, [height]);

  const total = items.length * size;
  const first = Math.max(0, Math.floor(scrollTop / size) - buffer);
  const last = Math.min(items.length, first + Math.ceil(clientH / size) + 2 * buffer);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrollTop(el.scrollTop);
    if (!onScrollEnd) return;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    if (atEnd && !endedRef.current) {
      endedRef.current = true;
      onScrollEnd();
    } else if (!atEnd) {
      endedRef.current = false;
    }
  };

  return (
    <div
      ref={viewportRef}
      onScroll={handleScroll}
      className={classNames('overflow-y-auto overflow-x-hidden', slots?.root, className)}
      style={{ height, ...style }}
    >
      {/* Spacer cao bằng tổng nội dung — giữ thanh cuộn đúng tỉ lệ */}
      <div style={{ height: total, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${first * size}px)`,
          }}
        >
          {items.slice(first, last).map((item, i) => (
            <Fragment key={first + i}>{renderItem(item, first + i)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
