// Tests Badge — hand-off §3 + Tailwind migration 2026-10-17 (contract --_dot).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge } from './index.js';

afterEach(() => {
  cleanup();
});

// 4 task status + 5 activity action (hand-off §3 BadgeVariant)
const BADGE_VARIANTS = [
  'todo',
  'doing',
  'done',
  'failed',
  'created',
  'updated',
  'assigned',
  'deleted',
  'assignmentFailed',
] as const;

describe('Badge (hand-off §3 — Tailwind migration 2026-10-17)', () => {
  it('render pill role=status + dot + children, variant map đúng --_dot', () => {
    render(<Badge variant="todo">Cần làm</Badge>);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Cần làm');
    // variant → CSS var --_dot (dot + nền color-mix 12% kế thừa cùng var)
    expect(badge).toHaveClass('[--_dot:var(--st-todo)]');
    // dot là con đầu — chấm màu 6px theo var
    expect(badge.firstElementChild).toHaveClass('bg-[var(--_dot)]');
  });

  it.each(BADGE_VARIANTS)('variant %s → utility --_dot riêng', (variant) => {
    render(<Badge variant={variant}>{variant}</Badge>);

    expect(screen.getByRole('status').className).toMatch(/\[--_dot:var\(--[\w-]+\)\]/);
  });

  it('className passthrough append sau structural class', () => {
    render(
      <Badge variant="done" className="extra-class">
        xong
      </Badge>,
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('extra-class', '[--_dot:var(--st-done)]');
  });
});
