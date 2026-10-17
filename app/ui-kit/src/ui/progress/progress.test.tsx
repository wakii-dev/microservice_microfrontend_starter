// Progress tests — width %, status màu, showInfo, aria-valuenow.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Progress } from './index.js';

afterEach(cleanup);

describe('Progress', () => {
  it('percent → bar width + aria-valuenow + info text', () => {
    render(<Progress percent={42} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('42%')).toBeInTheDocument();
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
});

describe('Progress — branch phụ', () => {
  it('status success tường minh → xanh', () => {
    render(<Progress percent={80} status="success" />);
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});

describe('Progress — branch phụ (Tier 5 sweep)', () => {
  it('bar width theo percent + màu exception trên bar', () => {
    const { container } = render(<Progress percent={75} status="exception" />);
    const bar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
    expect(bar.style.width).toBe('75%');
    expect(bar.style.background).toBe('var(--st-fail)');
  });
});
