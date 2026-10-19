// Grid tests — gutter (margin/padding/rowGap), span width %, justify/align/wrap,
// responsive mobile-first qua matchMedia mock (kể cả reactive đổi breakpoint).
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Col, Row } from './index.js';

type ChangeListener = (e: { matches: boolean; media: string }) => void;
const restoreFns: (() => void)[] = [];

/** Mock matchMedia điều khiển được: query nằm trong `active` mới matches; ghi lại
 *  listener 'change' để test bắn sự kiện mô phỏng viewport đổi breakpoint. */
function mockMatchMedia(active: string[]) {
  const listeners = new Map<string, Set<ChangeListener>>();
  const impl = (query: string) => ({
    matches: active.includes(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_: string, l: ChangeListener) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(l);
    },
    removeEventListener: (_: string, l: ChangeListener) => {
      listeners.get(query)?.delete(l);
    },
    dispatchEvent: () => false,
  });
  const original = window.matchMedia;
  window.matchMedia = impl as unknown as typeof window.matchMedia;
  const restore = () => {
    window.matchMedia = original;
  };
  restoreFns.push(restore);
  return {
    flip(query: string, matches: boolean) {
      if (matches && !active.includes(query)) active.push(query);
      if (!matches) {
        const i = active.indexOf(query);
        if (i >= 0) active.splice(i, 1);
      }
      act(() => {
        listeners.get(query)?.forEach((l) => l({ matches, media: query } as MediaQueryListEvent));
      });
    },
  };
}

afterEach(() => {
  cleanup();
  restoreFns.splice(0).forEach((fn) => fn());
});

describe('Row', () => {
  it('gutter number → negative margin nửa gutter (không rowGap)', () => {
    const { container } = render(
      <Row gutter={16}>
        <Col span={12}>a</Col>
      </Row>,
    );
    const row = container.firstElementChild!;
    expect(row.getAttribute('style')).toContain('margin-left: -8px');
    expect(row.getAttribute('style')).toContain('margin-right: -8px');
    expect(row.getAttribute('style')).not.toContain('row-gap');
    expect(row).toHaveClass('flex', 'flex-wrap'); // wrap mặc định bật như antd
  });

  it('gutter [8, 24] → margin -4px + rowGap 24; Col nhận padding nửa gutter ngang', () => {
    const { container } = render(
      <Row gutter={[8, 24]}>
        <Col span={12}>a</Col>
      </Row>,
    );
    const row = container.firstElementChild!;
    expect(row.getAttribute('style')).toContain('margin-left: -4px');
    expect(row.getAttribute('style')).toContain('row-gap: 24px');
    const col = row.firstElementChild!;
    expect(col.getAttribute('style')).toContain('padding-left: 4px');
    expect(col.getAttribute('style')).toContain('padding-right: 4px');
  });

  it('không gutter → không margin/padding (branch 0)', () => {
    const { container } = render(
      <Row>
        <Col span={12}>a</Col>
      </Row>,
    );
    const row = container.firstElementChild!;
    expect(row.getAttribute('style') ?? '').not.toContain('margin');
    expect(row.firstElementChild!.getAttribute('style') ?? '').not.toContain('padding');
  });

  it('justify + align → justify-content / align-items inline', () => {
    const { container } = render(
      <Row justify="space-between" align="center">
        <Col span={6}>a</Col>
        <Col span={6}>b</Col>
      </Row>,
    );
    const style = container.firstElementChild!.getAttribute('style')!;
    expect(style).toContain('justify-content: space-between');
    expect(style).toContain('align-items: center');
  });

  it('không justify/align → style không chứa 2 thuộc tính đó', () => {
    const { container } = render(
      <Row>
        <Col span={6}>a</Col>
      </Row>,
    );
    const style = container.firstElementChild!.getAttribute('style') ?? '';
    expect(style).not.toContain('justify-content');
    expect(style).not.toContain('align-items');
  });

  it('wrap={false} → flex-nowrap thay flex-wrap', () => {
    const { container } = render(
      <Row wrap={false}>
        <Col span={6}>a</Col>
      </Row>,
    );
    expect(container.firstElementChild).toHaveClass('flex-nowrap');
    expect(container.firstElementChild).not.toHaveClass('flex-wrap');
  });
});

describe('Col', () => {
  it.each([
    [8, '33.3333'],
    [12, '50%'],
    [24, '100%'],
  ] as const)('span %i → width %s', (span, width) => {
    const { container } = render(
      <Row>
        <Col span={span}>a</Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      `width: ${width}`,
    );
  });

  it('span ngoài 0–24 → clamp (30→100%, âm→0%)', () => {
    const { container, rerender } = render(
      <Row>
        <Col span={30}>a</Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      'width: 100%',
    );
    rerender(
      <Row>
        <Col span={-5}>a</Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      'width: 0%',
    );
  });

  it('không span và không responsive → không width (col co theo nội dung)', () => {
    const { container } = render(
      <Row>
        <Col>a</Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).not.toContain(
      'width',
    );
  });

  it('className + children truyền thẳng; className={undefined} không vỡ', () => {
    const { container } = render(
      <Row>
        <Col span={12} className="text-ink2">
          <span>body</span>
        </Col>
      </Row>,
    );
    const col = container.firstElementChild!.firstElementChild!;
    expect(col).toHaveClass('text-ink2');
    expect(col.textContent).toBe('body');
  });
});

describe('Col — responsive qua matchMedia (mobile-first cascade)', () => {
  it('không breakpoint nào match → dùng span base', () => {
    mockMatchMedia([]);
    const { container } = render(
      <Row>
        <Col span={24} md={8}>
          a
        </Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      'width: 100%',
    );
  });

  it('md match → md thắng span (8/24); bậc cao hơn không match giữ md', () => {
    mockMatchMedia(['(min-width: 768px)']);
    const { container } = render(
      <Row>
        <Col span={24} md={8} xl={6}>
          a
        </Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      `width: ${(8 / 24) * 100}%`,
    );
  });

  it('breakpoint match nhưng không khai báo span bậc đó → kế thừa bậc dưới', () => {
    mockMatchMedia(['(min-width: 640px)', '(min-width: 768px)', '(min-width: 1024px)', '(min-width: 1280px)']);
    const { container } = render(
      <Row>
        <Col span={12}>a</Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      'width: 50%',
    );
  });

  it('xs ghi đè span ở bậc base; sm match lại thắng xs', () => {
    const mm = mockMatchMedia([]);
    const { container, rerender } = render(
      <Row>
        <Col span={12} xs={24} sm={6}>
          a
        </Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      'width: 100%',
    );
    mm.flip('(min-width: 640px)', true);
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      'width: 25%',
    );
    rerender(
      <Row>
        <Col span={12} xs={24} sm={6}>
          a
        </Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      'width: 25%',
    );
  });

  it('viewport đổi breakpoint thật (change event) → width đổi reactive', () => {
    const mm = mockMatchMedia([]);
    const { container } = render(
      <Row>
        <Col span={24} lg={12}>
          a
        </Col>
      </Row>,
    );
    const col = () => container.firstElementChild!.firstElementChild!;
    expect(col().getAttribute('style')).toContain('width: 100%');
    mm.flip('(min-width: 1024px)', true); // xoay ngang / mở rộng cửa sổ
    expect(col().getAttribute('style')).toContain('width: 50%');
    mm.flip('(min-width: 1024px)', false); // thu lại → về span base
    expect(col().getAttribute('style')).toContain('width: 100%');
  });

  it('tất cả breakpoint match → bậc cao nhất (xl) thắng', () => {
    mockMatchMedia(['(min-width: 640px)', '(min-width: 768px)', '(min-width: 1024px)', '(min-width: 1280px)']);
    const { container } = render(
      <Row>
        <Col span={24} sm={12} md={8} lg={6} xl={4}>
          a
        </Col>
      </Row>,
    );
    expect(container.firstElementChild!.firstElementChild!.getAttribute('style')).toContain(
      `width: ${(4 / 24) * 100}%`,
    );
  });
});
