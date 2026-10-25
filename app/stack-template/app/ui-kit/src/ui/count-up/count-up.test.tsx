// CountUp tests — rAF stub chạy frame thủ công: giá trị cuối đúng, ease-out
// (giữa đường > nửa), duration respect, decimals/format, onDone đúng 1 lần,
// value đổi giữa chừng animate tiếp từ số cũ, unmount huỷ frame.
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountUp } from './index.js';

/** rAF thủ công — frame(now) chạy toàn bộ callback pending (id mới chạy frame sau).
 * Bọc `act` để setState từ callback flush vào DOM ngay (rAF ngoài act không flush). */
function stubRaf() {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    const id = nextId++;
    pending.set(id, cb);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
    pending.delete(id);
  }));
  return {
    frame(now: number) {
      act(() => {
        const cbs = [...pending.values()];
        pending.clear();
        cbs.forEach((cb) => cb(now));
      });
    },
    pendingCount: () => pending.size,
  };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CountUp', () => {
  it('khởi động từ 0, còn frame pending', () => {
    const raf = stubRaf();
    render(<CountUp value={1000} duration={1} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(raf.pendingCount()).toBe(1);
  });

  it('ease-out: giữa đường (t=0.5) đã đạt 875 > nửa quãng đường', () => {
    const raf = stubRaf();
    render(<CountUp value={1000} duration={1} />);
    raf.frame(0); // đặt mốc start, t = 0 → '0'
    expect(screen.getByText('0')).toBeInTheDocument();
    raf.frame(500); // t = 0.5 → eased = 1 − 0.5³ = 0.875 → '875'
    expect(screen.getByText('875')).toBeInTheDocument();
  });

  it('duration respect: t<1 chưa chạm đích; t>=1 chạm + onDone đúng 1 lần', () => {
    const raf = stubRaf();
    const onDone = vi.fn();
    render(<CountUp value={1000} duration={1} onDone={onDone} />);
    raf.frame(0); // start = 0, t = 0 → '0'
    expect(screen.getByText('0')).toBeInTheDocument();
    raf.frame(200); // t = 0.2 → eased ≈ 0.488 → chưa đích
    expect(screen.getByText('488')).toBeInTheDocument();
    raf.frame(1000); // t = 1 → '1000' + onDone
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(raf.pendingCount()).toBe(0); // xong → không còn frame
    raf.frame(2000); // frame thừa — không setState thêm
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('decimals=2 → hiển thị 2 chữ số thập phân', () => {
    const raf = stubRaf();
    render(<CountUp value={3.14159} duration={1} decimals={2} />);
    raf.frame(0);
    raf.frame(1000);
    expect(screen.getByText('3.14')).toBeInTheDocument();
  });

  it('format callback → chuỗi tuỳ ý (đơn vị)', () => {
    const raf = stubRaf();
    render(<CountUp value={1000} duration={1} format={(n) => `${n} tasks`} />);
    raf.frame(0);
    raf.frame(1000);
    expect(screen.getByText('1000 tasks')).toBeInTheDocument();
  });

  it('value đổi giữa chừng → animate tiếp từ số đang hiển thị', () => {
    const raf = stubRaf();
    const { rerender } = render(<CountUp value={1000} duration={1} />);
    raf.frame(0);
    raf.frame(1000); // xong vòng 1 → '1000'
    expect(screen.getByText('1000')).toBeInTheDocument();
    rerender(<CountUp value={2000} duration={1} />);
    raf.frame(1000); // frame mới, start lại — t = 0 → vẫn '1000'
    expect(screen.getByText('1000')).toBeInTheDocument();
    raf.frame(1500); // t = 0.5 → 1000 + 1000×0.875 = 1875
    expect(screen.getByText('1875')).toBeInTheDocument();
    raf.frame(2000);
    expect(screen.getByText('2000')).toBeInTheDocument();
  });

  it('unmount → huỷ frame pending (không chạy sau unmount)', () => {
    const raf = stubRaf();
    const { unmount } = render(<CountUp value={1000} duration={1} />);
    expect(raf.pendingCount()).toBe(1);
    unmount();
    expect(raf.pendingCount()).toBe(0);
    expect(() => raf.frame(0)).not.toThrow();
  });

  it('duration=0 → chạm đích ngay frame đầu', () => {
    const raf = stubRaf();
    render(<CountUp value={42} duration={0} />);
    raf.frame(0);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
