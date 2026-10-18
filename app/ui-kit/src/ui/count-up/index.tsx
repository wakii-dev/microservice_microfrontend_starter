// CountUp — đếm số ease-out cubic theo rAF (motion-effects W8, 0 deps):
// render span tabular-nums; `format` tuỳ ý (locale, đơn vị), `onDone` gọi đúng
// 1 lần khi chạm đích. Đổi `value` giữa chừng → animate tiếp từ số đang hiển thị
// (latest-ref cho onDone — effect không restart vì callback đổi identity).
import { useEffect, useRef, useState } from 'react';

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
}

export function CountUp({ value, duration = 1.2, decimals = 0, format, onDone, className }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone; // latest-ref — tránh effect restart khi callback đổi identity

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
    <span className={`tabular-nums${className ? ` ${className}` : ''}`}>
      {format ? format(rounded) : rounded.toFixed(decimals)}
    </span>
  );
}
