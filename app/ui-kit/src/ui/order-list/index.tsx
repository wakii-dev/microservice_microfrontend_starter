// OrderList — danh sách có nút lên/xuống (antd Transfer lite + reorder).
// slots-wave: classNames root/list/item + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import { useState } from 'react';
import type { CSSProperties } from 'react';

export interface OrderListItem { label: string; value: string }

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface OrderListClassNames {
  /** Div gốc bọc danh sách. */
  root?: string;
  /** <ul> danh sách cuộn. */
  list?: string;
  /** <li> mỗi hàng (gồm nút lên/xuống). */
  item?: string;
}

export interface OrderListProps {
  items: OrderListItem[];
  onChange?: (items: OrderListItem[]) => void;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: OrderListClassNames;
}

export function OrderList(props: OrderListProps) {
  const { onChange, className, style } = props;
  const slots = props.classNames;
  const [items, setItems] = useState(props.items);
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next); onChange?.(next);
  }
  return (
    <div className={classNames('inline-flex flex-col gap-2', slots?.root, className)} style={style}>
      <ul className={classNames('m-0 min-h-[200px] w-64 list-none overflow-auto rounded-xl border border-line bg-s2 p-2', slots?.list)}>
        {items.map((item, i) => (
          <li key={item.value} className={classNames('flex items-center justify-between rounded-lg px-3 py-1.5 text-body text-ink hover:bg-s3', slots?.item)}>
            <span>{i + 1}. {item.label}</span>
            <span className="flex gap-0.5">
              <button type="button" aria-label="Lên" disabled={i === 0} onClick={() => move(i, -1)}
                className="cursor-pointer border-none bg-transparent p-0.5 text-[10px] text-ink3 hover:text-accent disabled:opacity-30">▲</button>
              <button type="button" aria-label="Xuống" disabled={i === items.length - 1} onClick={() => move(i, 1)}
                className="cursor-pointer border-none bg-transparent p-0.5 text-[10px] text-ink3 hover:text-accent disabled:opacity-30">▼</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
