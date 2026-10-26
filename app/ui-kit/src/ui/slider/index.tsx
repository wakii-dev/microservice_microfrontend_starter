// Slider — antd look: track + handle + tooltip %; single + range; step; disabled.
// Customize pass (slots wave 3): classNames slots (root/track/fill/handle) +
// style passthrough — default path (không truyền) giữ nguyên DOM/behavior.
import classNames from 'classnames';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';

/** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định (consumer append). */
export interface SliderClassNames {
  /** Div row gốc — cùng element với className prop. */
  root?: string;
  /** Div role=slider (rail h-1.5, nhận click + keyboard). */
  track?: string;
  /** Div fill accent (đo bằng % theo value). */
  fill?: string;
  /** Span handle tròn (range mode: áp cho cả 2 handle). */
  handle?: string;
}

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
  /** Inline style — passthrough lên div row gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: SliderClassNames;
}

export function Slider(props: SliderProps) {
  const {
    value: valueProp, onChange, min = 0, max = 100, step = 1, disabled = false,
    ariaLabel = 'Thanh trượt', range, onRangeChange, className, style,
  } = props;
  const slots = props.classNames;
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
    <div className={classNames('flex w-full items-center gap-3', slots?.root, className)} style={style}>
      <div
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={min} aria-valuemax={max}
        aria-valuenow={isRange ? value[0] : (value as number)}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        className={classNames('relative h-1.5 w-full rounded-pill bg-line2 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none', disabled ? 'opacity-50' : 'cursor-pointer', slots?.track)}
        onClick={handleTrack}
      >
        <div
          className={classNames('absolute h-full rounded-pill bg-accent transition-[width,left] duration-200 ease-[var(--ease-smooth)]', slots?.fill)}
          style={isRange
            ? { left: `${pct(value[0])}%`, width: `${pct(value[1]) - pct(value[0])}%` }
            : { width: `${pct(value as number)}%` }}
        />
        {isRange ? (
          (value as [number, number]).map((v, i) => (
            <span key={i} className={classNames('absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-accent bg-white shadow-[var(--shadow-lift)] transition-[box-shadow] duration-200 ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)]', slots?.handle)} style={{ left: `${pct(v)}%` }} />
          ))
        ) : (
          <span className={classNames('absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-accent bg-white shadow-[var(--shadow-lift)] transition-[box-shadow] duration-200 ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)]', slots?.handle)} style={{ left: `${pct(value as number)}%` }} />
        )}
      </div>
    </div>
  );
}
