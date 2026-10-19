// Progress tests — width %, status colors, showInfo, aria attrs, clamp bounds, className.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Progress } from './index.js';

afterEach(cleanup);

const barOf = (container: HTMLElement) =>
  container.querySelector('[role="progressbar"] > div') as HTMLElement;

describe('Progress', () => {
  it('percent → bar width + aria-valuenow + info text', () => {
    render(<Progress percent={42} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('aria-valuemin/max = 0/100', () => {
    render(<Progress percent={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it('100% → màu success; exception → đỏ', () => {
    const { rerender } = render(<Progress percent={100} />);
    expect(screen.getByText('100%')).toHaveClass('text-ink');
    rerender(<Progress percent={30} status="exception" />);
    expect(screen.getByText('30%')).toHaveClass('text-st-fail');
  });

  it('showInfo=false → ẩn %', () => {
    render(<Progress percent={50} showInfo={false} />);
    expect(screen.queryByText('50%')).toBeNull();
  });

  it('status success tường minh → bar xanh (dù <100%)', () => {
    const { container } = render(<Progress percent={80} status="success" />);
    expect(barOf(container).style.background).toBe('var(--st-done)');
  });

  it('bar màu accent mặc định', () => {
    const { container } = render(<Progress percent={25} />);
    expect(barOf(container).style.background).toBe('var(--accent)');
  });

  it('edge clamp: âm → 0, >100 → 100 (aria + width + text)', () => {
    const { rerender, container } = render(<Progress percent={-5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(barOf(container).style.width).toBe('0%');
    rerender(<Progress percent={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(barOf(container).style.width).toBe('100%');
  });

  it('bar width theo percent + màu exception trên bar', () => {
    const { container } = render(<Progress percent={75} status="exception" />);
    expect(barOf(container).style.width).toBe('75%');
    expect(barOf(container).style.background).toBe('var(--st-fail)');
  });

  it('transition 200ms theo style matrix (không quá 200ms)', () => {
    const { container } = render(<Progress percent={10} />);
    expect(barOf(container).className).toContain('duration-200');
  });

  it('className passthrough', () => {
    render(<Progress percent={10} className="w-40" />);
    expect(screen.getByRole('progressbar').parentElement).toHaveClass('w-40');
  });
});

describe('Progress — indeterminate (motion waves)', () => {
  it('indeterminate → không aria-valuenow, ẩn % text, bar chạy vô hạn w-2/5', () => {
    render(<Progress indeterminate />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(screen.queryByText(/%/)).toBeNull();
    const fill = bar.firstElementChild as HTMLElement;
    expect(fill.className).toContain('animate-[bp-indeterminate_1.4s_ease-in-out_infinite]');
    expect(fill.className).toContain('motion-reduce:animate-none');
    expect(fill.style.width).toBe(''); // width do class, không inline (khác determinate)
  });

  it('determinate vẫn giữ aria-valuenow + % (không hồi quy)', () => {
    render(<Progress percent={60} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});
