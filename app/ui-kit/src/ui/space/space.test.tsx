// Space tests — size map + direction + wrap.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Space } from './index.js';

afterEach(cleanup);

describe('Space', () => {
  it.each([
    ['small', 8],
    ['middle', 16],
    ['large', 24],
  ] as const)('size %s → gap %ipx', (size, px) => {
    const { container } = render(
      <Space size={size}>
        <span>a</span>
        <span>b</span>
      </Space>,
    );
    expect(container.firstElementChild?.getAttribute('style')).toContain(`gap: ${px}px`);
  });

  it('size number → gap tuỳ ý; vertical → flex-col', () => {
    const { container } = render(
      <Space size={12} direction="vertical">
        <span>a</span>
      </Space>,
    );
    expect(container.firstElementChild?.getAttribute('style')).toContain('gap: 12px');
    expect(container.firstElementChild).toHaveClass('flex-col');
  });
});

describe('Space — branch phụ', () => {
  it('vertical + align start; wrap class', () => {
    const { container } = render(
      <Space direction="vertical" align="start" wrap>
        <span>a</span>
      </Space>,
    );
    const el = container.firstElementChild!;
    expect(el.getAttribute('style')).toContain('align-items: start');
    expect(el).toHaveClass('flex-col', 'flex-wrap');
  });
});

describe('Space — branch phụ (Tier 5 sweep)', () => {
  it('horizontal → không set align inline (undefined branch)', () => {
    const { container } = render(
      <Space size="middle">
        <span>a</span>
      </Space>,
    );
    expect(container.firstElementChild?.getAttribute('style')).not.toContain('align-items');
  });
});

// ── slots-wave: classNames slot + style passthrough ──

describe('Space — classNames + style', () => {
  it('slot root lên đúng div flex; className sau slot', () => {
    const { container } = render(
      <Space classNames={{ root: 'slot-root' }} className="user-last">
        <span>a</span>
      </Space>,
    );
    const el = container.firstElementChild!;
    expect(el).toHaveClass('slot-root', 'flex');
    expect(el.className.indexOf('slot-root')).toBeLessThan(el.className.indexOf('user-last'));
  });

  it('style passthrough merge sau gap (override được)', () => {
    const { container } = render(
      <Space size="large" style={{ gap: 40, padding: '4px' }}>
        <span>a</span>
      </Space>,
    );
    const style = container.firstElementChild!.getAttribute('style')!;
    expect(style).toContain('gap: 40px');
    expect(style).toContain('padding: 4px');
  });
});
