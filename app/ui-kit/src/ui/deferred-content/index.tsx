// DeferredContent — trì hoãn render nội dung nặng đến khi cuộn tới nhìn thấy
// (PrimeReact lite): IntersectionObserver 1 lần, fallback loadOnInit.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Skeleton } from '../skeleton/index.js';

export interface DeferredContentProps {
  /** Gọi MỘT LẦN khi nội dung vào viewport. */
  onVisible?: () => void;
  /** Bỏ qua observer — load ngay khi mount. */
  loadOnInit?: boolean;
  /** Placeholder trước khi load (mặc định: skeleton card). */
  placeholder?: ReactNode;
  /** Ngưỡng hiện của target (0–1), mặc định 0.2. */
  threshold?: number;
  children: ReactNode;
  className?: string;
}

export function DeferredContent({ onVisible, loadOnInit = false, placeholder, threshold = 0.2, children, className }: DeferredContentProps) {
  const [visible, setVisible] = useState(loadOnInit);
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (loadOnInit || visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback môi trường không có IO: load luôn (không treo placeholder vĩnh viễn).
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || fired.current) return;
        fired.current = true;
        setVisible(true);
        onVisible?.();
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onVisible/consumer callback: chỉ chạy 1 lần khi mount
  }, [loadOnInit, threshold]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : (placeholder ?? (
        <div className="flex gap-3 rounded-xl border border-line bg-s2 p-4" aria-busy="true" aria-label="Đang tải">
          <Skeleton variant="circle" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton variant="text" />
            <Skeleton variant="row" />
          </div>
        </div>
      ))}
    </div>
  );
}
