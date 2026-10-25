// Tests Spinner — hand-off §3.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Spinner } from './index.js';

afterEach(() => {
  cleanup();
});

describe('Spinner (hand-off §3 — 3 variants, motion identity)', () => {
  it('ring mặc định → animate-spin + màu accent', () => {
    render(<Spinner label="Đang cập nhật task" />);
    const el = screen.getByLabelText('Đang cập nhật task');
    expect(el).toHaveClass('text-accent');
    expect(el.firstElementChild).toHaveClass('animate-spin');
  });



  it('màu muted/inverse → text token riêng', () => {
    const { rerender } = render(<Spinner label="m" color="muted" />);
    expect(screen.getByLabelText('m')).toHaveClass('text-ink3');
    rerender(<Spinner label="i" color="inverse" />);
    expect(screen.getByLabelText('i')).toHaveClass('text-white');
  });

  it('dots → 3 chấm pulse stagger', () => {
    render(<Spinner label="d" variant="dots" />);
    expect(screen.getByLabelText('d').querySelectorAll('span.animate-\\[bp-dots_1\\.2s_ease-in-out_infinite\\]').length).toBe(3);
  });

  it('bars → 4 vạch scaleY', () => {
    render(<Spinner label="b" variant="bars" />);
    expect(screen.getByLabelText('b').querySelectorAll('span.animate-\\[bp-bars_1s_ease-in-out_infinite\\]').length).toBe(4);
  });
});

describe('Spinner — size (Tier 1.5)', () => {
  it.each([
    ['small', 'size-3'],
    ['default', 'size-3.5'],
    ['large', 'size-5'],
  ] as const)('size %s → ring span class %s', (size, cls) => {
    render(<Spinner label={`s-${size}`} size={size} />);
    expect(screen.getByLabelText(`s-${size}`).querySelector('span')).toHaveClass(cls);
  });
});

describe('Spinner — branch phụ', () => {
  it('role=status + aria-label bắt buộc (a11y contract)', () => {
    render(<Spinner label="Đang tải bảng" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Đang tải bảng');
  });

  it('ring dùng currentColor (border-current + border-t-transparent)', () => {
    render(<Spinner label="r" />);
    const ring = screen.getByLabelText('r').querySelector('span')!;
    expect(ring.className).toContain('border-current');
    expect(ring.className).toContain('border-t-transparent');
  });

  it('className passthrough', () => {
    render(<Spinner label="c" className="my-2" />);
    expect(screen.getByLabelText('c')).toHaveClass('my-2');
  });
});
