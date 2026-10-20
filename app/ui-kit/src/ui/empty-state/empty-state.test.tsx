// Tests EmptyState — hand-off §3.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EmptyState } from './index.js';

afterEach(() => {
  cleanup();
});

describe('EmptyState (hand-off §3)', () => {
  it('render title + description + action', () => {
    render(
      <EmptyState
        title="Chưa có task nào"
        description="Tạo task đầu tiên để bắt đầu."
        action={<button type="button">Tạo task</button>}
      />,
    );

    expect(screen.getByText('Chưa có task nào')).toBeInTheDocument();
    expect(screen.getByText('Tạo task đầu tiên để bắt đầu.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo task' })).toBeInTheDocument();
    // Identity Orbit (PO 2026-10-20): không image → SonarMark mờ mặc định (không emoji)
    expect(document.querySelector('.bp-empty svg')).not.toBeNull();
  });

  it('description + action là optional — bỏ qua khi không truyền', () => {
    render(<EmptyState title="Trống" />);

    expect(screen.getByText('Trống')).toBeInTheDocument();
    expect(document.querySelector('.bp-empty__description')).toBeNull();
    expect(document.querySelector('.bp-empty__action')).toBeNull();
  });
});

describe('EmptyState — image slot (Tier 1.5)', () => {
  it('image truyền → render slot; không truyền → không slot', () => {
    const { rerender } = render(<EmptyState title="t" image={<span data-testid="img" />} />);
    expect(screen.getByTestId('img')).toBeInTheDocument();
    rerender(<EmptyState title="t" />);
    expect(screen.queryByTestId('img')).toBeNull();
  });
});

it('EmptyState — className passthrough (branch)', () => {
  render(<EmptyState title="t" className="marker-es" />);
  expect(document.querySelector('.marker-es')).not.toBeNull();
});
