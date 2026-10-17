// Tests primitives design-system (SF-1, story VU-53) — ĐÚNG props API hand-off
// docs/superpowers/designs/ui-redesign-direction.md §3. Sống ở ui-kit từ 2026-10-17
// (tách khỏi fe-shared — ADR-0009): test đứng cạnh package nó test.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge, EmptyState, Skeleton, Spinner } from '../src/ui/index.js';

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

describe('Badge (hand-off §3)', () => {
  it('render pill role=status + dot + children, đúng class variant', () => {
    render(<Badge variant="todo">Cần làm</Badge>);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Cần làm');
    expect(badge).toHaveClass('bp-badge', 'bp-badge--todo');
    // dot là con đầu — CSS chấm màu 6px
    expect(badge.firstElementChild).toHaveClass('bp-badge__dot');
  });

  it.each(BADGE_VARIANTS)('variant %s → class bp-badge--%s', (variant) => {
    render(<Badge variant={variant}>{variant}</Badge>);

    expect(screen.getByRole('status')).toHaveClass(`bp-badge--${variant}`);
  });
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
    // KHÔNG icon (hand-off: icon KHÔNG, không emoji)
    expect(document.querySelector('.bp-empty img, .bp-empty svg')).toBeNull();
  });

  it('description + action là optional — bỏ qua khi không truyền', () => {
    render(<EmptyState title="Trống" />);

    expect(screen.getByText('Trống')).toBeInTheDocument();
    expect(document.querySelector('.bp-empty__description')).toBeNull();
    expect(document.querySelector('.bp-empty__action')).toBeNull();
  });
});

describe('Skeleton (hand-off §3)', () => {
  it('wrapper aria-busy + đúng class variant, mặc định 1 khối', () => {
    render(<Skeleton variant="card" />);

    const wrapper = document.querySelector('[aria-busy="true"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelectorAll('.bp-skeleton--card')).toHaveLength(1);
  });

  it('count=N render N khối', () => {
    render(<Skeleton variant="row" count={3} />);

    expect(document.querySelectorAll('.bp-skeleton--row')).toHaveLength(3);
  });
});

describe('Spinner (hand-off §3)', () => {
  it('aria-label bắt buộc từ prop label', () => {
    render(<Spinner label="Đang cập nhật task" />);

    expect(screen.getByLabelText('Đang cập nhật task')).toHaveClass('bp-spinner');
  });
});
