// CountUp — đếm số ease-out cubic theo rAF (motion-effects W8, 0 deps):
// render span tabular-nums; `format` tuỳ ý (locale, đơn vị), `onDone` gọi đúng
// 1 lần khi chạm đích. Đổi `value` giữa chừng → animate tiếp từ số đang hiển thị
// (latest-ref cho onDone — effect không restart vì callback đổi identity).
// Depth contract 2026-10-19: đổi giá trị → pulse nhẹ (re-zoom 280ms ease-smooth,
// tái dùng keyframe bp-zoom-in — không đúc keyframe mới; reduced-motion tắt nhờ
// block global). Chỉ pulse từ lần ĐỔI thứ 2 trở đi — mount đầu không nhấp nháy.
import classNames from 'classnames';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface CountUpClassNames {
  /** Span gốc hiển thị số. */
  root?: string;
}

export interface CountUpProps {
  /** Giá trị đích. */
  value: number;
  /** Thời lượng animation (giây) — mặc định 1.2. */
  duration?: number;
  /** Số chữ số thập phân hiển thị (toFixed). */
  decimals?: number;
  /** Format hiển thị — nhận số đã làm tròn theo `decimals`. */
  format?: (n: number) => string;
  /** Gọi 1 lần khi animation chạm giá trị đích. */
  onDone?: () => void;
  className?: string;
  /** Inline style — merge SAU animation pulse (consumer override được). */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: CountUpClassNames;
}

export function CountUp(props: CountUpProps) {
  const { value, duration = 1.2, decimals = 0, format, onDone, className, style } = props;
  const slots = props.classNames;
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone; // latest-ref — tránh effect restart khi callback đổi identity
  // Pulse khi giá trị ĐỔI (depth contract) — đếm lần đổi, key restart animation
  const [changeCount, setChangeCount] = useState(0);
  const valueRef = useRef(value);
  useEffect(() => {
    if (valueRef.current !== value) {
      valueRef.current = value;
      setChangeCount((c) => c + 1);
    }
  }, [value]);

  useEffect(() => {
    const from = fromRef.current;
    const ms = Math.max(0, duration * 1000);
    let raf = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic — nhanh đầu, chậm cuối
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
        onDoneRef.current?.();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const rounded = Number(display.toFixed(decimals));
  return (
    <span
      key={changeCount}
      style={{ ...(changeCount > 0 ? { animation: 'bp-zoom-in 280ms var(--ease-smooth)' } : undefined), ...style }}
      className={classNames('tabular-nums inline-block', slots?.root, className)}
    >
      {format ? format(rounded) : rounded.toFixed(decimals)}
    </span>
  );
}
