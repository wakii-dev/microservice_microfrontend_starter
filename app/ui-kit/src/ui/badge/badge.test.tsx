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

// ── Count/standalone mode (antd Badge — case-coverage audit 2026-10-18) ──

describe('Badge — count mode (antd parity)', () => {
  it('count standalone: pill accent với số, không children', () => {
    render(<Badge count={5} />);
    expect(screen.getByText('5')).toHaveClass('bg-accent');
  });

  it('count bọc children: wrapper relative + sup absolute góc phải-trên', () => {
    render(<Badge count={5}><span data-testid="slot">x</span></Badge>);
    const wrapper = screen.getByTestId('slot').parentElement!;
    expect(wrapper).toHaveClass('relative', 'inline-flex');
    const sup = wrapper.querySelector('sup')!;
    expect(sup).toHaveClass('absolute', 'bg-accent');
    expect(sup).toHaveTextContent('5');
  });

  it.each([
    [150, undefined, '99+'],
    [150, 10, '10+'],
  ])('count %i overflowCount %s → "%s" (antd overflow)', (count, overflowCount, expected) => {
    render(<Badge count={count} overflowCount={overflowCount} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('count = 0 ẩn (mặc định); showZero hiển thị "0"', () => {
    const { rerender } = render(<Badge count={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    rerender(<Badge count={0} showZero />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('count = 0 + children → children vẫn render, chỉ ẩn sup', () => {
    render(<Badge count={0}><span data-testid="slot">x</span></Badge>);
    expect(screen.getByTestId('slot')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('dot: chấm không số (bọc children)', () => {
    render(<Badge dot><span data-testid="slot">x</span></Badge>);
    const sup = screen.getByTestId('slot').parentElement!.querySelector('sup')!;
    expect(sup).toHaveClass('size-2');
    expect(sup).toBeEmptyDOMElement();
  });

  it('offset → transform translate px trên sup', () => {
    render(<Badge count={5} offset={[6, -4]}><span>x</span></Badge>);
    const sup = screen.getByText('5');
    expect(sup).toHaveStyle({ transform: 'translate(6px, -4px)' });
  });

  it.each([
    ['success', '--st-done'],
    ['processing', '--accent'],
    ['error', '--st-fail'],
    ['warning', '--st-doing'],
    ['default', '--st-todo'],
  ] as const)('status %s → dot token %s + text hiển thị', (status, token) => {
    const { container } = render(<Badge status={status} text="Label" />);
    const dot = container.querySelector('span[aria-hidden="true"]')!;
    expect(dot).toHaveClass(`[--_dot:var(${token})]`, 'bg-[var(--_dot)]');
    expect(screen.getByText('Label')).toBeInTheDocument();
  });
});
