// Skeleton tests — variants, count, role/aria-busy, shimmer keyframes (regression: tên
// keyframes phải là bp-shimmer — bản cũ bp-shimmer-anim không tồn tại → shimmer chết).
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton } from './index.js';

afterEach(cleanup);

describe('Skeleton', () => {
  it('wrapper role=status + aria-busy + card variant = rounded-xl, mặc định 1 khối', () => {
    const { container } = render(<Skeleton variant="card" />);
    const wrapper = container.querySelector('[aria-busy="true"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper).toHaveAttribute('role', 'status');
    expect(wrapper?.querySelectorAll('.rounded-xl')).toHaveLength(1);
  });

  it('count=N render N khối', () => {
    const { container } = render(<Skeleton variant="row" count={3} />);
    expect(container.querySelectorAll('.h-11')).toHaveLength(3);
  });

  it.each([
    ['text', 'h-4'],
    ['row', 'h-11'],
    ['card', 'h-24'],
    ['circle', 'size-10'],
    ['button', 'h-8'],
  ] as const)('variant %s → bone đúng size class', (variant, sizeCls) => {
    const { container } = render(<Skeleton variant={variant} />);
    expect(container.querySelector('span[aria-hidden="true"]')?.className).toContain(sizeCls);
  });

  it('radius theo token: text/row = rounded-1, circle = rounded-pill, button = rounded-lg', () => {
    const { container: c1 } = render(<Skeleton variant="text" />);
    expect(c1.querySelector('span[aria-hidden]')?.className).toContain('rounded-1');
    const { container: c2 } = render(<Skeleton variant="circle" />);
    expect(c2.querySelector('span[aria-hidden]')?.className).toContain('rounded-pill');
    const { container: c3 } = render(<Skeleton variant="button" />);
    expect(c3.querySelector('span[aria-hidden]')?.className).toContain('rounded-lg');
  });

  it('shimmer overlay ::after tồn tại qua class overflow-hidden', () => {
    const { container } = render(<Skeleton variant="text" />);
    expect(container.querySelector('.overflow-hidden')).not.toBeNull();
  });

  it('REGRESSION: shimmer dùng keyframes bp-shimmer (đã định nghĩa trong tailwind.css)', () => {
    const { container } = render(<Skeleton />);
    const overlay = container.querySelector('span[aria-hidden] span')!;
    expect(overlay.className).toContain('animate-[bp-shimmer_');
    expect(overlay.className).not.toContain('bp-shimmer-anim');
  });

  it('variant lạ fallback → row (VARIANT_CLS fallback branch)', () => {
    const { container } = render(<Skeleton variant={'ghost' as 'text'} />);
    expect(container.querySelector('span[aria-hidden]')?.className).toContain('h-11');
  });

  it('classNames slots (antd v5) — wrapper + bone đúng element, merge sau default', () => {
    const { container } = render(
      <Skeleton variant="text" count={2} classNames={{ wrapper: 'sw', bone: 'sb' }} />,
    );
    const wrapper = container.querySelector('[role="status"]');
    expect(wrapper).toHaveClass('sw');
    expect(wrapper).toHaveClass('flex'); // default giữ nguyên
    const bones = container.querySelectorAll('span[aria-hidden]');
    expect(bones).toHaveLength(2);
    bones.forEach((b) => {
      expect(b).toHaveClass('sb');
      expect(b).toHaveClass('h-4'); // default variant giữ nguyên
    });
  });
});
