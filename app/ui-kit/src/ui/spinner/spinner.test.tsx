// Tests Spinner — hand-off §3.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Spinner } from './index.js';

afterEach(() => {
  cleanup();
});

describe('Spinner (hand-off §3)', () => {
  it('aria-label bắt buộc từ prop label', () => {
    render(<Spinner label="Đang cập nhật task" />);

    expect(screen.getByLabelText('Đang cập nhật task')).toHaveClass('animate-spin');
  });
});

describe('Spinner — size (Tier 1.5)', () => {
  it.each([
    ['small', 'size-3'],
    ['default', 'size-3.5'],
    ['large', 'size-5'],
  ] as const)('size %s → class %s', (size, cls) => {
    render(<Spinner label={`s-${size}`} size={size} />);
    expect(screen.getByLabelText(`s-${size}`)).toHaveClass(cls);
  });
});
