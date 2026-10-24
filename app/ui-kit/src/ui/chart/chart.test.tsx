// Chart peer-dep — jsdom không có canvas 2D → test fallback + interop resolve + config
// passthrough (mock Chart class bắt shape config thay vì đo pixel).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chart } from './index.js';
afterEach(cleanup);

const CONFIG = { type: 'bar' as const, labels: ['T1', 'T2'], datasets: [{ label: 'd', data: [1, 2] }] };

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

  it('interop ESM thuần: named Chart export → resolve mod.Chart', async () => {
    const ChartStub = vi.fn(() => ({ destroy: vi.fn() }));
    vi.doMock('chart.js/auto', () =>
      Promise.resolve({ Chart: ChartStub, default: ChartStub, __esModule: true }));
    const { Chart: ChartMocked } = await import('./index.js');
    render(<ChartMocked config={CONFIG} />);
    await vi.waitFor(() => expect(ChartStub).toHaveBeenCalled());
    vi.doUnmock('chart.js/auto');
  });

  it('interop default-only (một số bundler): mod.default là Chart class → vẫn vẽ', async () => {
    const ChartStub = vi.fn(() => ({ destroy: vi.fn() }));
    vi.doMock('chart.js/auto', () => Promise.resolve({ default: ChartStub, __esModule: true }));
    const { Chart: ChartMocked } = await import('./index.js');
    render(<ChartMocked config={CONFIG} />);
    await vi.waitFor(() => expect(ChartStub).toHaveBeenCalled());
    vi.doUnmock('chart.js/auto');
  });

  it('config wrap ĐÚNG shape chart.js v4: { type, data: { labels, datasets } } — gốc của bug "canvas mounted alpha=0"', async () => {
    const ChartStub = vi.fn(() => ({ destroy: vi.fn() }));
    vi.doMock('chart.js/auto', () => Promise.resolve({ Chart: ChartStub, __esModule: true }));
    const { Chart: ChartMocked } = await import('./index.js');
    render(<ChartMocked config={CONFIG} />);
    await vi.waitFor(() => expect(ChartStub).toHaveBeenCalled());
    // vi.fn() zero-param → mock.calls tuple rỗng về type; cast để đọc arg truyền vào
    const cfg = (ChartStub.mock.calls[0] as unknown[] | undefined)?.[1];
    expect(cfg).toMatchObject({ type: 'bar', data: { labels: ['T1', 'T2'], datasets: [{ label: 'd', data: [1, 2] }] } });
    // labels/datasets KHÔNG còn nằm top-level (shape sai cũ)
    expect(cfg).not.toHaveProperty('labels');
    vi.doUnmock('chart.js/auto');
  });

  it('config native nested (data lồng) vẫn vẽ dữ liệu — app/admin pass-through', async () => {
    const ChartStub = vi.fn(() => ({ destroy: vi.fn() }));
    vi.doMock('chart.js/auto', () => Promise.resolve({ Chart: ChartStub, __esModule: true }));
    const { Chart: ChartMocked } = await import('./index.js');
    const NESTED = {
      type: 'line' as const,
      data: { labels: ['T2', 'T3'], datasets: [{ label: 'n', data: [3, 4] }] },
    };
    render(<ChartMocked config={NESTED} />);
    await vi.waitFor(() => expect(ChartStub).toHaveBeenCalled());
    const cfg = (ChartStub.mock.calls[0] as unknown[] | undefined)?.[1];
    // nested vẫn resolve đủ → chart.js nhận labels/datasets trong `data` (không rỗng câm lặng)
    expect(cfg).toMatchObject({ type: 'line', data: { labels: ['T2', 'T3'], datasets: [{ label: 'n', data: [3, 4] }] } });
    vi.doUnmock('chart.js/auto');
  });

  it('Chart class không resolve được (module rỗng) → fallback, KHÔNG để canvas trắng câm lặng', async () => {
    vi.doMock('chart.js/auto', () => Promise.resolve({}));
    const { Chart: ChartMocked } = await import('./index.js');
    render(<ChartMocked config={CONFIG} fallback={<p>Chart lỗi</p>} />);
    await vi.waitFor(() => expect(screen.getByText('Chart lỗi')).toBeInTheDocument());
    expect(screen.queryByRole('img')).toBeNull();
    vi.doUnmock('chart.js/auto');
  });

  it('unmount → destroy() chart instance (không leak canvas)', async () => {
    const destroy = vi.fn();
    const ChartStub = vi.fn(() => ({ destroy }));
    vi.doMock('chart.js/auto', () => Promise.resolve({ Chart: ChartStub, __esModule: true }));
    const { Chart: ChartMocked } = await import('./index.js');
    const { unmount } = render(<ChartMocked config={CONFIG} />);
    await vi.waitFor(() => expect(ChartStub).toHaveBeenCalled());
    unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
    vi.doUnmock('chart.js/auto');
  });

  it('height prop → inline style container; className passthrough', () => {
    const { container } = render(<Chart config={{ type: 'bar', labels: [], datasets: [] }} height={180} className="marker" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('180px');
    expect(wrapper).toHaveClass('marker');
    expect(wrapper.querySelector('canvas')).not.toBeNull();
  });
});
