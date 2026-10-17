// Chart peer-dep — jsdom không có canvas 2D → test fallback + config passthrough.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Chart } from './index.js';
afterEach(cleanup);

describe('Chart', () => {
  it('không fallback → render canvas', () => {
    const { container } = render(<Chart config={{ type: 'bar', labels: [], datasets: [] }} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
  it('fallback render khi chart.js fail', () => {
    render(<Chart config={{ type: 'bar', labels: [], datasets: [] }} fallback={<p>No chart</p>} />);
    expect(screen.getByText('No chart')).toBeInTheDocument();
  });
});
