// OrderList — danh sách có nút lên/xuống (antd Transfer lite + reorder).
import { useState } from 'react';

export interface OrderListItem { label: string; value: string }

export interface OrderListProps {
  items: OrderListItem[];
  onChange?: (items: OrderListItem[]) => void;
  className?: string;
}

export function OrderList({ items: itemsProp, onChange, className }: OrderListProps) {
  const [items, setItems] = useState(itemsProp);
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next); onChange?.(next);
  }
  return (
    <div className={`inline-flex flex-col gap-2${className ? ` ${className}` : ''}`}>
      <ul className="m-0 min-h-[200px] w-64 list-none overflow-auto rounded-xl border border-line bg-s2 p-2">
        {items.map((item, i) => (
          <li key={item.value} className="flex items-center justify-between rounded-2 px-3 py-1.5 text-body text-ink hover:bg-s3">
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
