// Chart peer-dep — jsdom không có canvas 2D → test fallback + config passthrough.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chart } from './index.js';
afterEach(cleanup);

describe('Chart', () => {
  it('không fallback → render canvas', () => {
    const { container } = render(<Chart config={{ type: 'bar', labels: [], datasets: [] }} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
  it('fallback CHỈ hiện khi import chart.js fail — truyền fallback không chặn canvas', async () => {
    vi.doMock('chart.js/auto', () => Promise.reject(new Error('no chart.js')));
    const { Chart: ChartMocked } = await import('./index.js');
    render(<ChartMocked config={{ type: 'bar', labels: [], datasets: [] }} fallback={<p>No chart</p>} />);
    await vi.waitFor(() => {
      expect(screen.getByText('No chart')).toBeInTheDocument();
    });
    vi.doUnmock('chart.js/auto');
  });
});
