// Knob — dial value (antd lite): circular indicator + drag.
// A11y (batch ⑫ worker C): role=slider + Arrow keys (±1, clamp min/max) —
// trước đây chỉ drag chuột, keyboard không với tới.
import { useCallback, useRef, type KeyboardEvent } from 'react';

export interface KnobProps {
  value?: number;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
  size?: number;
  /** aria-label cho role=slider (mặc định 'Điều khiển giá trị'). */
  ariaLabel?: string;
  className?: string;
}

export function Knob({ value = 0, onChange, min = 0, max = 100, size = 96, ariaLabel = 'Điều khiển giá trị', className }: KnobProps) {
  const ref = useRef<SVGSVGElement>(null);
  const r = size / 2 - 8;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const arc = (270 / 360) * circumference;

  const onDrag = useCallback((clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI + 90;
    if (deg > 135) deg -= 360;
    const pct = Math.min(100, Math.max(0, ((deg + 135) / 270) * 100));
    onChange?.(Math.round(min + (pct / 100) * (max - min)));
  }, [min, max, onChange]);

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    onChange?.(Math.min(max, Math.max(min, value + step)));
  };

  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      role="slider" aria-label={ariaLabel} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} tabIndex={0}
      onKeyDown={onKeyDown}
      className={`cursor-grab active:cursor-grabbing${className ? ` ${className}` : ''}`}
      onMouseDown={(e) => { const move = (me: MouseEvent) => onDrag(me.clientX, me.clientY); const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); onDrag(e.clientX, e.clientY); }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line2)" strokeWidth="6"
        strokeDasharray={`${arc} ${circumference}`} strokeLinecap="round"
        transform={`rotate(135 ${c} ${c})`} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--accent)" strokeWidth="6"
        strokeDasharray={`${(pct(value) / 100) * arc} ${circumference}`} strokeLinecap="round"
        transform={`rotate(135 ${c} ${c})`} />
      <text x={c} y={c + 6} textAnchor="middle" fill="var(--ink)" fontSize={size * 0.18} fontWeight="600">{value}</text>
    </svg>
  );
}

function pct(v: number) { return v; }
