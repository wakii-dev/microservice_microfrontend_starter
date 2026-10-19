// Statistic tests — value/prefix/suffix/title (antd: content 24 semibold).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Statistic } from './index.js';

afterEach(cleanup);

describe('Statistic', () => {
  it('title + value + suffix', () => {
    render(<Statistic title="Tổng task" value={42} suffix="việc" />);
    expect(screen.getByText('Tổng task')).toBeInTheDocument();
    expect(screen.getByText('42')).toHaveClass('text-2xl');
    expect(screen.getByText('việc')).toBeInTheDocument();
  });

  it('prefix + valueStyle', () => {
    render(<Statistic prefix="$" value={9} valueStyle={{ color: 'var(--st-done)' }} />);
    expect(screen.getByText('$')).toBeInTheDocument();
    expect(screen.getByText('9')).toHaveStyle({ color: 'var(--st-done)' });
  });

  it('không title → không render title div; không suffix/prefix → không span', () => {
    render(<Statistic value={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.queryByText(/Tổng|task/i)).toBeNull();
  });

  it('value là ReactNode → render nguyên node', () => {
    render(<Statistic value={<b data-testid="node">1.234</b>} />);
    expect(screen.getByTestId('node')).toBeInTheDocument();
  });

  it('className passthrough lên root; giá trị dùng tabular-nums', () => {
    const { container } = render(<Statistic value={5} className="marker" />);
    expect(container.firstElementChild).toHaveClass('marker');
    const flex = container.querySelector<HTMLElement>('[style*="tabular-nums"]');
    expect(flex).not.toBeNull();
  });
});
