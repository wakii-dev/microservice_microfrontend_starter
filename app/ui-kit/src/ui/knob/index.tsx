// Knob — dial value (antd lite): circular indicator + drag.
import { useCallback, useRef, useState } from 'react';

export interface KnobProps {
  value?: number;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
  size?: number;
  className?: string;
}

export function Knob({ value = 0, onChange, min = 0, max = 100, size = 96, className }: KnobProps) {
  const ref = useRef<SVGSVGElement>(null);
  const angle = ((value - min) / (max - min)) * 270 - 135;
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

  return (
    <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}
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
