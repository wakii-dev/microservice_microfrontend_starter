// Affix tests — position sticky CSS + onChange đo trên scroll container thật
// (jsdom: container inline overflowY auto → được dò là scroll parent). Trạng thái
// bám mô phỏng bằng mock getBoundingClientRect trên wrapper.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Affix } from './index.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const RECT: DOMRect = {
  x: 0, y: 0, width: 100, height: 40, top: 0, right: 100, bottom: 40, left: 0,
  toJSON: () => ({}),
} as DOMRect;

/** Mock getBoundingClientRect trên wrapper — set đủ field, override từng phần. */
function setupRect(el: HTMLElement, rect: Partial<DOMRect>) {
  return vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ ...RECT, ...rect });
}

describe('Affix', () => {
  it('render children trong wrapper sticky + top = offsetTop px', () => {
    const { getByTestId } = render(
      <Affix offsetTop={12}>
        <div data-testid="content">Toolbar</div>
      </Affix>,
    );
    expect(getByTestId('content')).toBeInTheDocument();
    const wrapper = getByTestId('content').parentElement!;
    expect(wrapper.style.position).toBe('sticky');
    expect(wrapper.style.top).toBe('12px');
  });

  it('offsetBottom → bottom mode (style.bottom, không style.top)', () => {
    const { getByTestId } = render(
      <Affix offsetBottom={8}>
        <div data-testid="content">Footer bar</div>
      </Affix>,
    );
    const wrapper = getByTestId('content').parentElement!;
    expect(wrapper.style.position).toBe('sticky');
    expect(wrapper.style.bottom).toBe('8px');
    expect(wrapper.style.top).toBe('');
  });

  it('scroll container thật: scroll qua offset → onChange(true), scroll lùi → onChange(false)', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <div data-testid="scroller" style={{ overflowY: 'auto', height: 200 }}>
        <Affix offsetTop={10} onChange={onChange}>
          <div data-testid="content">Bar</div>
        </Affix>
      </div>,
    );
    const wrapper = getByTestId('content').parentElement!;
    const scroller = getByTestId('scroller');

    // chưa qua ngưỡng (rect.top 50 > 10) → false → false: không fire
    const spy = setupRect(wrapper, { top: 50 });
    fireEvent.scroll(scroller);
    expect(onChange).not.toHaveBeenCalled();

    // scroll qua ngưỡng → bám
    spy.mockReturnValue({ ...RECT, top: 5 });
    fireEvent.scroll(scroller);
    expect(onChange).toHaveBeenCalledWith(true);

    // scroll lùi → nhả bám
    spy.mockReturnValue({ ...RECT, top: 60 });
    fireEvent.scroll(scroller);
    expect(onChange).toHaveBeenCalledWith(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('trạng thái không đổi qua các lần scroll → onChange KHÔNG fire lặp', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <div data-testid="scroller" style={{ overflowY: 'auto' }}>
        <Affix offsetTop={10} onChange={onChange}>
          <div data-testid="content">Bar</div>
        </Affix>
      </div>,
    );
    const wrapper = getByTestId('content').parentElement!;
    const spy = setupRect(wrapper, { top: 5 });
    const scroller = getByTestId('scroller');
    fireEvent.scroll(scroller);
    spy.mockReturnValue({ ...RECT, top: 4 }); // vẫn <= offsetTop → vẫn bám
    fireEvent.scroll(scroller);
    fireEvent.scroll(scroller);
    expect(onChange).toHaveBeenCalledTimes(1); // false → true đúng 1 lần
  });

  it('không có ancestor scrollable → fallback window scroll vẫn đo được', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <Affix offsetTop={20} onChange={onChange}>
        <div data-testid="content">Bar</div>
      </Affix>,
    );
    const wrapper = getByTestId('content').parentElement!;
    setupRect(wrapper, { top: 3 });
    fireEvent.scroll(window);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('bottom mode với window: rect.bottom chạm innerHeight − offset → onChange(true)', () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <Affix offsetBottom={10} onChange={onChange}>
        <div data-testid="content">Bar</div>
      </Affix>,
    );
    const wrapper = getByTestId('content').parentElement!;
    setupRect(wrapper, { bottom: 759 }); // 768 (jsdom innerHeight) − 10 + 1 → đã chạm mép
    fireEvent.scroll(window);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('target() chỉ đích danh container → scroll event trên đó được nghe', () => {
    const onChange = vi.fn();
    let scroller: HTMLElement | null = null;
    const { getByTestId } = render(
      // ref callback commit trước effect → target() luôn có container
      <div ref={(el) => { scroller = el; }} style={{ overflow: 'hidden' }}>
        <Affix offsetTop={10} onChange={onChange} target={() => scroller!}>
          <div data-testid="content">Bar</div>
        </Affix>
      </div>,
    );
    const wrapper = getByTestId('content').parentElement!;
    setupRect(wrapper, { top: 2 });
    fireEvent.scroll(scroller!);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

// ── slots-wave: classNames slot + style passthrough ──

describe('Affix — classNames + style', () => {
  it('slot root lên div sticky; className sau slot', () => {
    const { container } = render(
      <Affix classNames={{ root: 'slot-root' }} className="user-last">
        <span>content</span>
      </Affix>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveClass('slot-root');
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
  });

  it('style passthrough merge sau sticky top (override được)', () => {
    const { container } = render(<Affix offsetTop={16} style={{ top: 4, background: 'rgb(1, 2, 3)' }}><span>x</span></Affix>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveStyle({ top: '4px', background: 'rgb(1, 2, 3)' });
  });
});
