// StatTile — Card + Statistic từ ui-kit (app-fit migration 2026-10-18): thay raw
// div + tailwind. Statistic được thiết kế thay StatTile (comment ui-kit: "GIỮ
// ariaLabel contract — wiring ở activity") → wrapper div giữ aria-label NGUYÊN
// VĂN (tests getByLabelText + toHaveTextContent đọc textContent subtree).
// Label thành Statistic title (chuẩn antd — trên value); hover viền giữ qua
// className passthrough.
// Motion redesign: value ĐẾM SỐ animate khi vào viewport — useMotionValue +
// useTransform + animate() (motion/react, bundle LOCAL) + useInView CỦA KIT
// (fallback: không IntersectionObserver → inView=true — jsdom tests thấy giá trị
// ĐÍCH ngay, contract toHaveTextContent giữ nguyên). prefers-reduced-motion →
// hiển thị tĩnh (useReducedMotion).
import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { Card, Statistic, useInView } from '@wakii/ui-kit';

export interface StatTileProps {
  /** aria-label NGUYÊN VĂN — contract a11y có test (context pack: KHÔNG đổi) */
  ariaLabel: string;
  label: string;
  value: number;
}

/** Số đếm animate 0 → value khi tile vào viewport (một lần). */
function AnimatedValue({ value }: { value: number }) {
  const reduceMotion = useReducedMotion() ?? false;
  // Môi trường không có IntersectionObserver (jsdom/SSR) hoặc user tắt motion:
  // render TĨNH giá trị đích — không đếm.
  const canAnimate = typeof IntersectionObserver !== 'undefined' && !reduceMotion;
  const { ref, inView } = useInView<HTMLSpanElement>({ once: true });
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => String(Math.round(v)));

  useEffect(() => {
    if (!canAnimate || !inView) return;
    const controls = animate(count, value, { duration: 0.5, ease: 'easeOut' });
    return () => controls.stop();
  }, [canAnimate, count, inView, value]);

  if (!canAnimate) return <span>{value}</span>;
  return <motion.span ref={ref}>{display}</motion.span>;
}

export function StatTile({ ariaLabel, label, value }: StatTileProps) {
  return (
    <div aria-label={ariaLabel}>
      <Card size="small" className="h-full transition-colors duration-150 hover:border-line2">
        <Statistic title={label} value={<AnimatedValue value={value} />} />
      </Card>
    </div>
  );
}
