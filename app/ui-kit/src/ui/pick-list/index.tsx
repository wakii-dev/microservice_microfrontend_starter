// PickList — 2 cột chuyển item qua lại (antd Transfer lite).
// Audit fix 2026-10-18: hex → bg-accent/10; ›/‹ → Icon + aria-label; role
// listbox/option + aria-selected; keyboard ↑↓ + Enter/Space pick từng listbox.
// Panel hoist ra module-level (định nghĩa trong component = function identity
// đổi mỗi render → React remount panel, mất state keyboard + stale DOM node).
import { useState, type KeyboardEvent } from 'react';
import { Button } from '../button/index';
import { Icon } from '../icons/index.js';

export interface PickListItem { label: string; value: string }

export interface PickListProps {
  source: PickListItem[];
  target: PickListItem[];
  onChange?: (source: PickListItem[], target: PickListItem[]) => void;
  className?: string;
}

interface PanelProps {
  title: string;
  items: PickListItem[];
  picked: Set<string>;
  onPick: (v: string) => void;
}

function Panel({ title, items, picked, onPick }: PanelProps) {
  // Keyboard a11y listbox: ↑↓ di chuyển active, Enter/Space toggle pick.
  // active khởi đầu = 0 (Enter ngay khi focus = pick item đầu — pattern listbox).
  const [activeIdx, setActiveIdx] = useState(0);
  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIdx((i) => (i + dir + items.length) % items.length);
    } else if ((e.key === 'Enter' || e.key === ' ') && items[activeIdx]) {
      e.preventDefault();
      onPick(items[activeIdx].value);
    }
  }
  return (
    <div className="flex-1">
      <div className="mb-1 text-label font-semibold text-ink2">{title}</div>
      <ul
        role="listbox" aria-label={title} aria-multiselectable="true" tabIndex={0}
        onKeyDown={onKeyDown}
        className="m-0 min-h-[200px] list-none rounded-xl border border-line bg-s2 p-2 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
      >
        {items.map((item, i) => (
          <li key={item.value} role="option" aria-selected={picked.has(item.value)}
            onClick={() => { onPick(item.value); setActiveIdx(i); }}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-body transition-colors ${picked.has(item.value) ? 'bg-accent/10 text-accent' : 'text-ink'} ${i === activeIdx && !picked.has(item.value) ? 'bg-s3' : ''} hover:bg-s3`}>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PickList({ source: sourceProp, target: targetProp, onChange, className }: PickListProps) {
  const [source, setSource] = useState(sourceProp);
  const [target, setTarget] = useState(targetProp);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  function moveToTarget() {
    const moving = source.filter((s) => picked.has(s.value));
    const nextSource = source.filter((s) => !picked.has(s.value));
    setSource(nextSource);
    setTarget([...target, ...moving]);
    onChange?.(nextSource, [...target, ...moving]);
    setPicked(new Set());
  }
  function moveToSource() {
    const moving = target.filter((t) => picked.has(t.value));
    const nextTarget = target.filter((t) => !picked.has(t.value));
    setTarget(nextTarget);
    setSource([...source, ...moving]);
    onChange?.([...source, ...moving], nextTarget);
    setPicked(new Set());
  }

  // Chọn/bỏ chọn 1 item (click toggle) — trước đây onPick là no-op → không
  // thể pick gì cả, nút chuyển luôn disabled.
  function togglePick(v: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  }

  return (
    <div className={`flex items-center gap-3${className ? ` ${className}` : ''}`}>
      <Panel title="Nguồn" items={source} picked={picked} onPick={togglePick} />
      <div className="flex flex-col gap-1">
        <Button size="small" aria-label="Chuyển sang đích" onClick={moveToTarget} disabled={picked.size === 0} icon={<Icon name="chevron-right" size={12} />} />
        <Button size="small" aria-label="Chuyển về nguồn" onClick={moveToSource} disabled={picked.size === 0} icon={<Icon name="chevron-left" size={12} />} />
      </div>
      <Panel title="Đích" items={target} picked={picked} onPick={togglePick} />
    </div>
  );
}
