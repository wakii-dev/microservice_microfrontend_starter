import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StagePipeline } from './index.js';

afterEach(cleanup);

const STAGES = [
  { key: 'baseline', label: 'Baseline', state: 'done' as const },
  { key: 'apply', label: 'Áp depth', state: 'running' as const },
  { key: 'review', label: 'Review', state: 'gated' as const },
  { key: 'ship', label: 'Ship', state: 'pending' as const },
];

describe('StagePipeline', () => {
  it('render đủ stages theo thứ tự + số thứ tự mono', () => {
    render(<StagePipeline stages={STAGES} />);
    expect(screen.getByText('Baseline')).toBeInTheDocument();
    expect(screen.getByText('Áp depth')).toBeInTheDocument();
    expect(screen.getByText('Ship')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
  });

  it('running/gated → aria-current="step"; pending/done không', () => {
    render(<StagePipeline stages={STAGES} />);
    expect(screen.getByText('Áp depth').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Review').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Baseline').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('state màu token: done chip st-done, gated chip st-doing', () => {
    render(<StagePipeline stages={STAGES} />);
    expect(screen.getByText('Baseline').closest('span')).toHaveClass('text-st-done');
    expect(screen.getByText('Review').closest('span')).toHaveClass('text-st-doing');
  });

  it('mũi tên nối = stages-1 (ngang); dọc không có mũi tên ngang', () => {
    const { container, rerender } = render(<StagePipeline stages={STAGES} />);
    const arrows = container.querySelectorAll('[aria-label="Team pipeline"] svg');
    // mỗi stage 1 icon + (stages-1) arrow → tổng = stages*2 - 1
    expect(arrows.length).toBe(STAGES.length * 2 - 1);
    rerender(<StagePipeline stages={STAGES} direction="vertical" />);
    expect(container.querySelectorAll('ol svg').length).toBe(STAGES.length);
  });

  it('gated stage có mô tả gate cho screen reader', () => {
    render(<StagePipeline stages={STAGES} />);
    expect(screen.getByText('(gate — chờ duyệt)')).toHaveClass('sr-only');
  });
});
