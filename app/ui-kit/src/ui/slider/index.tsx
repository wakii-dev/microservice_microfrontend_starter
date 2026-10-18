// Slider — antd look: track + handle + tooltip %; single + range; step; disabled.
import { useState, type KeyboardEvent } from 'react';

export interface SliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Accessible name cho role="slider" (axe aria-input-field-name). */
  ariaLabel?: string;
  /** Range mode — [min, max]. */
  range?: [number, number] | undefined;
  onRangeChange?: (range: [number, number]) => void;
  className?: string;
}

export function Slider({ value: valueProp, onChange, min = 0, max = 100, step = 1, disabled = false, ariaLabel = 'Thanh trượt', range, onRangeChange, className }: SliderProps) {
  const [internal, setInternal] = useState(range ? ([...range] as [number, number]) : (valueProp ?? min));
  const value: number | [number, number] = range
    ? (range as [number, number])
    : ((valueProp ?? internal) as number);
  const isRange = Array.isArray(value);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  function handleTrack(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = min + ((e.clientX - rect.left) / rect.width) * (max - min);
    const snapped = Math.round(raw / step) * step;
    if (isRange && Array.isArray(value)) {
      const [lo, hi] = value as [number, number];
      const next: [number, number] = Math.abs(snapped - lo) < Math.abs(snapped - hi) ? [Math.min(snapped, hi), hi] : [lo, Math.max(snapped, lo)];
      setInternal(next); onRangeChange?.(next);
    } else {
      setInternal(snapped); onChange?.(snapped);
    }
  }

  // Keyboard a11y (role="slider" + tabIndex=0 phải bấm được bằng phím): ←↓/→↑ ±step,
  // clamp [min,max]; range mode: ←↓ dời cận dưới, →↑ dời cận trên (deterministic).
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const inc = e.key === 'ArrowUp' || e.key === 'ArrowRight';
    const dec = e.key === 'ArrowDown' || e.key === 'ArrowLeft';
    if (!inc && !dec) return;
    e.preventDefault();
    const delta = inc ? step : -step;
    if (isRange && Array.isArray(value)) {
      const [lo, hi] = value as [number, number];
      const next: [number, number] = inc ? [lo, Math.min(max, hi + delta)] : [Math.max(min, lo + delta), hi];
      setInternal(next); onRangeChange?.(next);
    } else {
      const next = Math.min(max, Math.max(min, (value as number) + delta));
      setInternal(next); onChange?.(next);
    }
  }

  return (
    <div className={`flex w-full items-center gap-3${className ? ` ${className}` : ''}`}>
      <div
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min} aria-valuemax={max}
        aria-valuenow={isRange ? value[0] : (value as number)}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={`relative h-1.5 w-full rounded-pill bg-line2 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
        onClick={handleTrack}
      >
        <div
          className="absolute h-full rounded-pill bg-accent"
          style={isRange
            ? { left: `${pct(value[0])}%`, width: `${pct(value[1]) - pct(value[0])}%` }
            : { width: `${pct(value as number)}%` }}
        />
        {isRange ? (
          (value as [number, number]).map((v, i) => (
            <span key={i} className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-accent bg-white shadow-[var(--shadow-lift)]" style={{ left: `${pct(v)}%` }} />
          ))
        ) : (
          <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-accent bg-white shadow-[var(--shadow-lift)]" style={{ left: `${pct(value as number)}%` }} />
        )}
      </div>
    </div>
  );
}
