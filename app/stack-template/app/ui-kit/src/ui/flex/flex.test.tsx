// Flex tests — direction, gap (thang Space + number), justify/align, wrap.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Flex } from './index.js';

afterEach(cleanup);

describe('Flex', () => {
  it('mặc định: hàng ngang + gap small 8px, không wrap', () => {
    const { container } = render(
      <Flex>
        <span>a</span>
        <span>b</span>
      </Flex>,
    );
    const el = container.firstElementChild!;
    expect(el).toHaveClass('flex', 'flex-row');
    expect(el).not.toHaveClass('flex-col', 'flex-wrap');
    expect(el.getAttribute('style')).toContain('gap: 8px');
  });

  it.each([
    ['small', 8],
    ['middle', 16],
    ['large', 24],
  ] as const)('gap %s → gap %ipx', (gap, px) => {
    const { container } = render(
      <Flex gap={gap}>
        <span>a</span>
      </Flex>,
    );
    expect(container.firstElementChild!.getAttribute('style')).toContain(`gap: ${px}px`);
  });

  it('gap number → px tuỳ ý; vertical → flex-col', () => {
    const { container } = render(
      <Flex vertical gap={12}>
        <span>a</span>
      </Flex>,
    );
    const el = container.firstElementChild!;
    expect(el.getAttribute('style')).toContain('gap: 12px');
    expect(el).toHaveClass('flex-col');
    expect(el).not.toHaveClass('flex-row');
  });

  it('justify + align → justify-content / align-items inline', () => {
    const { container } = render(
      <Flex justify="space-between" align="baseline">
        <span>a</span>
        <span>b</span>
      </Flex>,
    );
    const style = container.firstElementChild!.getAttribute('style')!;
    expect(style).toContain('justify-content: space-between');
    expect(style).toContain('align-items: baseline');
  });

  it('không justify/align → style không chứa 2 thuộc tính đó', () => {
    const { container } = render(
      <Flex>
        <span>a</span>
      </Flex>,
    );
    const style = container.firstElementChild!.getAttribute('style')!;
    expect(style).not.toContain('justify-content');
    expect(style).not.toContain('align-items');
  });

  it('wrap → flex-wrap; className merge vào cuối', () => {
    const { container } = render(
      <Flex wrap className="text-ink2">
        <span>a</span>
      </Flex>,
    );
    const el = container.firstElementChild!;
    expect(el).toHaveClass('flex-wrap', 'text-ink2');
  });
});
