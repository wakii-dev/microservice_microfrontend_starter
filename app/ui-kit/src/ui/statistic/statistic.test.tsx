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
});
