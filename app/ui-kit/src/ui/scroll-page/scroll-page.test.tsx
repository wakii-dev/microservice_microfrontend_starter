// ScrollPage tests — snap classes, IO active/onChange, keyboard nav, indicator aria,
// reduced-motion snap-none, autoPlay + hover pause. IO/matchMedia/scrollIntoView mock
// (jsdom không implement cả 3).
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { ScrollPage } from './index.js';

class MockIntersectionObserver {
  static latest: MockIntersectionObserver | null = null;
  cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    MockIntersectionObserver.latest = this;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  fire(entries: Array<{ target: Element; intersectionRatio: number; isIntersecting: boolean }>): void {
    this.cb(entries as unknown as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}

const originalIO = window.IntersectionObserver;
const originalMatchMedia = window.matchMedia;
const originalSiv = Element.prototype.scrollIntoView;

function installEnv({ reduced = false } = {}) {
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver;
  // closure thường — KHÔNG vi.fn(): restoreAllMocks sau mỗi test không xoá implementation
  window.matchMedia = (query: string) => ({
    matches: reduced && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  Element.prototype.scrollIntoView = vi.fn();
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeAll(() => {
  installEnv();
});

beforeEach(() => {
  installEnv(); // mỗi test reinstall — test reduced-motion trước đó không pollute matchMedia
});

afterAll(() => {
  window.IntersectionObserver = originalIO;
  window.matchMedia = originalMatchMedia;
  Element.prototype.scrollIntoView = originalSiv;
});

function fireActive(index: number) {
  const container = document.querySelector('[data-scroll-page-section]')?.parentElement;
  const sections = Array.from(container?.querySelectorAll('[data-scroll-page-section]') ?? []);
  const entries = sections.map((target, i) => ({
    target,
    intersectionRatio: i === index ? 0.95 : 0.05,
    isIntersecting: true,
  }));
  act(() => {
    MockIntersectionObserver.latest?.fire(entries);
  });
}

function renderThree(onChange?: (i: number) => void) {
  return render(
    <ScrollPage ariaLabel="Demo" onChange={onChange}>
      <ScrollPage.Section ariaLabel="Màn 1">S1</ScrollPage.Section>
      <ScrollPage.Section ariaLabel="Màn 2">S2</ScrollPage.Section>
      <ScrollPage.Section ariaLabel="Màn 3">S3</ScrollPage.Section>
    </ScrollPage>,
  );
}

describe('ScrollPage', () => {
  it('container snap-y snap-mandatory + section snap-start min-h-screen (không wheel-hijack)', () => {
    const { container } = renderThree();
    const scroller = container.querySelector('div[role="region"]')!;
    expect(scroller.className).toContain('snap-y');
    expect(scroller.className).toContain('snap-mandatory');
    expect(container.querySelectorAll('[data-scroll-page-section]').length).toBe(3);
    const first = container.querySelector('[data-scroll-page-section]') as HTMLElement;
    expect(first.className).toContain('snap-start');
    expect(first.className).toContain('min-h-screen');
  });

  it('IntersectionObserver mock: section ratio cao nhất thành active → indicator aria-current + onChange(index)', () => {
    const onChange = vi.fn();
    const { container } = renderThree(onChange);
    fireActive(1);
    const dots = container.querySelectorAll('button[aria-label^="Đi tới màn"]');
    expect(dots.length).toBe(3);
    expect(dots[1].getAttribute('aria-current')).toBe('true');
    expect(dots[0].getAttribute('aria-current')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('onChange payload 0-based: mount bắn 0 (IO initial), sau đó theo lần fire', () => {
    const onChange = vi.fn();
    renderThree(onChange);
    fireActive(2);
    fireActive(0);
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([0, 2, 0]);
  });

  it('keyboard ArrowDown/PageUp/Home/End → scrollIntoView đúng section (smooth, không reduced)', () => {
    const { container } = renderThree();
    const region = container.querySelector('div[role="region"]') as HTMLElement;
    const sections = container.querySelectorAll('[data-scroll-page-section]');
    fireEvent.keyDown(region, { key: 'ArrowDown' });
    expect(sections[1].scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    fireEvent.keyDown(region, { key: 'PageDown' });
    expect(sections[2].scrollIntoView).toHaveBeenCalled();
    fireEvent.keyDown(region, { key: 'PageUp' });
    expect(sections[1].scrollIntoView).toHaveBeenCalled();
    fireEvent.keyDown(region, { key: 'Home' });
    expect(sections[0].scrollIntoView).toHaveBeenCalled();
    fireEvent.keyDown(region, { key: 'End' });
    expect(sections[2].scrollIntoView).toHaveBeenCalled();
  });

  it('indicator click → scrollIntoView section đó + aria-current cập nhật sau IO', () => {
    const { container } = renderThree();
    const dots = container.querySelectorAll('button[aria-label^="Đi tới màn"]');
    fireEvent.click(dots[2]);
    const sections = container.querySelectorAll('[data-scroll-page-section]');
    expect(sections[2].scrollIntoView).toHaveBeenCalled();
    fireActive(2);
    expect(dots[2].getAttribute('aria-current')).toBe('true');
  });

  it('reduced-motion → snap-none (không snap-mandatory) và scrollIntoView behavior auto', () => {
    installEnv({ reduced: true });
    const { container } = renderThree();
    const scroller = container.querySelector('div[role="region"]')!;
    expect(scroller.className).toContain('snap-none');
    expect(scroller.className).not.toContain('snap-mandatory');
    fireEvent.keyDown(scroller as HTMLElement, { key: 'ArrowDown' });
    const sections = container.querySelectorAll('[data-scroll-page-section]');
    expect(sections[1].scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('autoPlay ms → tự scrollIntoView màn kế; hover giữ pause (không call mới)', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <ScrollPage ariaLabel="Slide" autoPlay={1000}>
          <ScrollPage.Section>S1</ScrollPage.Section>
          <ScrollPage.Section>S2</ScrollPage.Section>
        </ScrollPage>,
      );
      const sections = container.querySelectorAll('[data-scroll-page-section]');
      const spy = sections[0].scrollIntoView as unknown as ReturnType<typeof vi.fn>;
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(spy).toHaveBeenCalled(); // slide 1 → màn 2
      // wrap vòng: hết màn cuối quay lại màn đầu
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);
      // hover → PAUSE: snapshot count trước, 3s sau không có call mới
      const region = container.querySelector('div[role="region"]') as HTMLElement;
      fireEvent.mouseEnter(region);
      const beforeHover = spy.mock.calls.length;
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(spy.mock.calls.length).toBe(beforeHover);
    } finally {
      vi.useRealTimers();
    }
  });
});
