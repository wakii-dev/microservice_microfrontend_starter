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

    expect(screen.getByLabelText('Đang cập nhật task')).toHaveClass('bp-spinner');
  });
});
