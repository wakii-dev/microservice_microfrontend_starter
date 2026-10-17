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
