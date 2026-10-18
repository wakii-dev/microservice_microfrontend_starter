// Parallax tests — transform đặt theo rect mock (sync frame đầu) + scroll đổi
// offset (rAF) + reduced-motion/disabled/speed-0 tắt + cleanup listener/rAF.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Parallax } from './index.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.matchMedia = originalMatchMedia; // mock matchMedia là vi.fn (không phải spy) — hoàn tác tay
});

const originalMatchMedia = window.matchMedia;

function mockRect(top: number, height = 100) {
  return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top,
    left: 0,
    width: 200,
    height,
    bottom: top + height,
    right: 200,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
}

/** jsdom rAF chạy trên timer ~16ms — chờ 1 frame thật. */
const waitFrame = () => new Promise((r) => setTimeout(r, 30));

function translateYOf(el: HTMLElement): number {
  const m = /translate3d\(0, ([-\d.]+)px/.exec(el.style.transform);
  return m ? Number(m[1]) : NaN;
}

/** Mock matchMedia — pattern useMediaQuery.test.ts. */
function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn(() => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe('Parallax', () => {
  it('mount → transform đặt ngay theo rect mock + speed (frame đầu sync)', () => {
    mockRect(0); // tâm element (50) lệch tâm viewport (384) → progress ≈ -0.87
    const { container } = render(
      <Parallax speed={0.5}>
        <div>hero</div>
      </Parallax>,
    );
    const y = translateYOf(container.firstElementChild as HTMLElement);
    expect(y).toBeCloseTo(52.1875, 2);
    expect((container.firstElementChild as HTMLElement).style.willChange).toBe('transform');
  });

  it('scroll → transform đổi theo rect mới (rAF throttle)', async () => {
    const rectSpy = mockRect(0);
    const { container } = render(
      <Parallax speed={0.5}>
        <div>hero</div>
      </Parallax>,
    );
    rectSpy.mockReturnValue({
      top: 400, left: 0, width: 200, height: 100, bottom: 500, right: 200, x: 0, y: 400, toJSON: () => ({}),
    } as DOMRect);
    document.dispatchEvent(new Event('scroll'));
    await waitFrame();
    // progress = (400+50−384)/384 = 0.171875 (exact) → y = −10.3125 (exact)
    expect(translateYOf(container.firstElementChild as HTMLElement)).toBeCloseTo(-10.3125, 3);
  });

  it('prefers-reduced-motion → tự tắt: không transform, scroll không có tác dụng', async () => {
    mockMatchMedia(true);
    mockRect(0);
    const { container } = render(
      <Parallax speed={0.5}>
        <div>hero</div>
      </Parallax>,
    );
    document.dispatchEvent(new Event('scroll'));
    await waitFrame();
    expect((container.firstElementChild as HTMLElement).style.transform).toBe('none');
  });

  it('disabled → tắt hẳn (children vẫn render)', async () => {
    mockRect(0);
    const { container, getByText } = render(
      <Parallax speed={0.5} disabled>
        <div>hero</div>
      </Parallax>,
    );
    document.dispatchEvent(new Event('scroll'));
    await waitFrame();
    expect(getByText('hero')).toBeInTheDocument();
    expect((container.firstElementChild as HTMLElement).style.transform).toBe('none');
  });

  it('speed=0 → inactive (không track scroll)', () => {
    mockRect(0);
    const { container } = render(
      <Parallax speed={0}>
        <div>hero</div>
      </Parallax>,
    );
    expect((container.firstElementChild as HTMLElement).style.transform).toBe('none');
  });

  it('scale → transform kèm scale theo speed', () => {
    mockRect(0);
    const { container } = render(
      <Parallax speed={0.5} scale>
        <div>hero</div>
      </Parallax>,
    );
    expect((container.firstElementChild as HTMLElement).style.transform).toMatch(/scale\(1\.07/);
  });

  it('strength 280 → biên trôi gấp 280/120 tại cùng rect (default 120 giữ tương thích)', () => {
    mockRect(0);
    const { container } = render(
      <Parallax speed={0.5} strength={280}>
        <div>hero</div>
      </Parallax>,
    );
    // progress -0.8698 × 0.5 × 280 = 121.7708 (mặc định 120 sẽ là 52.1875)
    expect(translateYOf(container.firstElementChild as HTMLElement)).toBeCloseTo(121.7708, 2);
  });

  it('cleanup: unmount → scroll không còn schedule rAF', async () => {
    mockRect(0);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    const { unmount } = render(
      <Parallax speed={0.5}>
        <div>hero</div>
      </Parallax>,
    );
    await waitFrame();
    const callsAfterMount = rafSpy.mock.calls.length;
    unmount();
    document.dispatchEvent(new Event('scroll'));
    await waitFrame();
    expect(rafSpy.mock.calls.length).toBe(callsAfterMount);
  });
});
