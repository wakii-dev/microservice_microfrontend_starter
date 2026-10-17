// PickList — 2 cột chuyển item qua lại (antd Transfer lite).
import { useState } from 'react';
import { Button } from '../button/index';

export interface PickListItem { label: string; value: string }

export interface PickListProps {
  source: PickListItem[];
  target: PickListItem[];
  onChange?: (source: PickListItem[], target: PickListItem[]) => void;
  className?: string;
}

export function PickList({ source: sourceProp, target: targetProp, onChange, className }: PickListProps) {
  const [source, setSource] = useState(sourceProp);
  const [target, setTarget] = useState(targetProp);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  function moveToTarget() {
    const moving = source.filter((s) => picked.has(s.value));
    setSource(source.filter((s) => !picked.has(s.value)));
    setTarget([...target, ...moving]);
    onChange?.(source.filter((s) => !picked.has(s.value)), [...target, ...moving]);
    setPicked(new Set());
  }
  function moveToSource() {
    const moving = target.filter((t) => picked.has(t.value));
    setTarget(target.filter((t) => !picked.has(t.value)));
    setSource([...source, ...moving]);
    onChange?.([...source, ...moving], target.filter((t) => !picked.has(t.value)));
    setPicked(new Set());
  }

  function Panel({ title, items, onPick }: { title: string; items: PickListItem[]; onPick: (v: string) => void }) {
    return (
      <div className="flex-1">
        <div className="mb-1 text-label font-semibold text-ink2">{title}</div>
        <ul className="m-0 min-h-[200px] list-none rounded-3 border border-line bg-s2 p-2">
          {items.map((item) => (
            <li key={item.value}
              onClick={() => onPick(item.value)}
              className={`cursor-pointer rounded-2 px-3 py-1.5 text-body transition-colors ${picked.has(item.value) ? 'bg-[#e6f4ff] text-accent' : 'text-ink hover:bg-s3'}`}>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3${className ? ` ${className}` : ''}`}>
      <Panel title="Nguồn" items={source} onPick={() => {}} />
      <div className="flex flex-col gap-1">
        <Button size="small" onClick={moveToTarget} disabled={picked.size === 0}>›</Button>
        <Button size="small" onClick={() => {}} disabled>‹</Button>
      </div>
      <Panel title="Đích" items={target} onPick={() => {}} />
    </div>
  );
}
