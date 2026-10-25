// VirtualScroll tests — window+buffer mount, scroll mở rộng window, spacer height
// đúng items*itemSize, translateY offset, onScrollEnd edge-detect, buffer prop,
// height CSS string đo clientHeight, itemSize 0 được clamp.
// jsdom không layout: stub clientHeight/scrollHeight/scrollTop trên instance viewport.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VirtualScroll } from './index.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Ghi đè thuộc tính layout trên instance (jsdom trả 0 cho mọi client/scroll size). */
function stubLayout(el: HTMLElement, props: { clientHeight?: number; scrollHeight?: number }) {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(el, key, { configurable: true, value });
  }
}

function setScrollTop(el: HTMLElement, value: number) {
  Object.defineProperty(el, 'scrollTop', { configurable: true, value });
}

function Row({ i }: { i: number }) {
  return (
    <div data-i={i} className="flex h-10 items-center border-b border-line2 px-4 text-body text-ink2">
      Row {i}
    </div>
  );
}

function renderVirtual(overrides?: Partial<Parameters<typeof VirtualScroll<number>>[0]>) {
  const utils = render(
    <VirtualScroll
      items={Array.from({ length: 1000 }, (_, i) => i)}
      itemSize={40}
      height={200}
      renderItem={(i) => <Row i={i} />}
      {...overrides}
    />,
  );
  const viewport = utils.container.firstElementChild as HTMLElement;
  const sizer = viewport.firstElementChild as HTMLElement;
  const content = sizer.firstElementChild as HTMLElement;
  const rows = () => Array.from(viewport.querySelectorAll<HTMLElement>('[data-i]'));
  return { ...utils, viewport, sizer, content, rows };
}

describe('VirtualScroll', () => {
  it('1000 items → chỉ mount window + buffer (15 rows = 5 visible + 2×5 buffer), không render toàn bộ', () => {
    const { rows } = renderVirtual();
    expect(rows()).toHaveLength(15); // ceil(200/40) + 2*5
    expect(rows()[0].dataset.i).toBe('0');
    expect(rows()[14].dataset.i).toBe('14');
    expect(viewport_queryAbsent(rows(), '15')).toBe(true);
    expect(rows().length).toBeLessThan(1000);
  });

  it('scroll tới index 100 → window dịch: mount 95–109, bỏ 0; translateY = first*itemSize', () => {
    const { rows, content, viewport } = renderVirtual();
    setScrollTop(viewport, 4000); // 4000/40 = 100
    fireEvent.scroll(viewport);
    const indexes = rows().map((r) => r.dataset.i);
    expect(indexes).toHaveLength(15);
    expect(indexes[0]).toBe('95'); // 100 - buffer 5
    expect(indexes[14]).toBe('109');
    expect(content.style.transform).toBe('translateY(3800px)'); // 95 * 40
    expect(indexes).not.toContain('0');
  });

  it('itemSize → spacer height = items × itemSize (1000 × 40 = 40000px)', () => {
    const { sizer } = renderVirtual();
    expect(sizer.style.height).toBe('40000px');
  });

  it('onScrollEnd bắn đúng 1 lần mỗi lần chạm đáy; rời đáy rồi quay lại → bắn lại', () => {
    const onScrollEnd = vi.fn();
    const { viewport } = renderVirtual({ onScrollEnd });
    stubLayout(viewport, { clientHeight: 200, scrollHeight: 40000 });

    setScrollTop(viewport, 39800); // 39800 + 200 = 40000 ≥ 40000 - 1
    fireEvent.scroll(viewport);
    expect(onScrollEnd).toHaveBeenCalledTimes(1);

    setScrollTop(viewport, 39801); // vẫn ở đáy → không bắn thêm
    fireEvent.scroll(viewport);
    expect(onScrollEnd).toHaveBeenCalledTimes(1);

    setScrollTop(viewport, 0); // rời đáy → reset
    fireEvent.scroll(viewport);
    setScrollTop(viewport, 39800);
    fireEvent.scroll(viewport);
    expect(onScrollEnd).toHaveBeenCalledTimes(2);
  });

  it('buffer lớn hơn → mount rộng hơn (buffer 20 → 45 rows)', () => {
    const { rows } = renderVirtual({ buffer: 20 });
    expect(rows()).toHaveLength(45); // 5 + 2*20
  });

  it('height CSS string → đo clientHeight sau mount (300 → 8 visible + buffer = 18 rows)', () => {
    vi.spyOn(window.HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300);
    const { rows } = renderVirtual({ height: '100%' });
    expect(rows()).toHaveLength(18); // ceil(300/40) + 2*5
  });

  it('itemSize 0 (vô nghĩa) → clamp về 1, không NaN', () => {
    const { sizer, rows } = renderVirtual({ items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], itemSize: 0 });
    expect(sizer.style.height).toBe('10px');
    expect(rows()).toHaveLength(10);
    expect(rows()[0].dataset.i).toBe('1'); // index đầu 0 → item giá trị 1 (data-i là item)
  });

  it('className merge vào viewport; onScrollEnd không truyền → không lỗi', () => {
    const { viewport } = renderVirtual({ className: 'rounded-xl border border-line' });
    expect(viewport).toHaveClass('overflow-y-auto', 'rounded-xl', 'border-line');
    setScrollTop(viewport, 1000);
    expect(() => fireEvent.scroll(viewport)).not.toThrow();
  });
});

function viewport_queryAbsent(rows: HTMLElement[], index: string) {
  return !rows.some((r) => r.dataset.i === index);
}
