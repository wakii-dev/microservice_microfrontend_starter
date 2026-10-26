// experience3d tests — jsdom KHÔNG có WebGL: WebGLRenderer ném khi tạo context
// → hành vi đúng cần verify là (1) fallback render thay vì crash, (2) static mode
// không khởi rAF loop, (3) props surface (className/height/fallback passthrough),
// (4) ScrollFlythrough progress prop. Canvas THẬT + fps + drag đo bằng Playwright
// (evidence R11) — không thể trong jsdom.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Scene3D, ScrollFlythrough, ShipModel } from './index.js';

afterEach(cleanup);

describe('experience3d — graceful trong môi trường không WebGL', () => {
  it('ShipModel: WebGL fail → fallback mặc định (không crash, có nút thử lại)', async () => {
    render(<ShipModel height={300} />);
    // import('three') async — chờ microtask chain resolve/reject xong
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText(/Không render được cảnh 3D/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  it('Scene3D: fallback prop passthrough khi WebGL fail', async () => {
    render(
      <Scene3D height={200} fallback={<div role="status">cần three peer-dep</div>} />,
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByRole('status')).toHaveTextContent('cần three peer-dep');
  });

  it('reducedMotion → static frame: KHÔNG khởi động rAF loop (fallback vẫn hiện đúng)', async () => {
    render(<ScrollFlythrough progress={0.4} reducedMotion fallback={<div>fallback-3d</div>} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('fallback-3d')).toBeInTheDocument();
  });

  it('height passthrough + aria-label mô tả cảnh', () => {
    const { container } = render(<ShipModel height={240} className="marker-3d" />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.style.height).toBe('240px');
    expect(host).toHaveClass('marker-3d');
    expect(host).toHaveAttribute('aria-label', expect.stringContaining('tàu 3D'));
  });

  it('ScrollFlythrough: progress đổi không crash (chế độ fallback)', async () => {
    const { rerender } = render(<ScrollFlythrough progress={0.1} fallback={<div>fb</div>} />);
    await new Promise((r) => setTimeout(r, 50));
    rerender(<ScrollFlythrough progress={0.7} fallback={<div>fb</div>} />);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('fb')).toBeInTheDocument();
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('experience3d — classNames + style', () => {
  it('slot root lên host div cả 3 component; className sau slot', () => {
    const { container } = render(
      <>
        <ShipModel height={120} classNames={{ root: 'slot-root' }} className="user-last" />
        <Scene3D height={120} classNames={{ root: 'slot-root' }} />
        <ScrollFlythrough height={120} reducedMotion classNames={{ root: 'slot-root' }} />
      </>,
    );
    const hosts = container.querySelectorAll('.slot-root');
    expect(hosts).toHaveLength(3);
    expect(hosts[0]!.className.indexOf('slot-root')).toBeLessThan(hosts[0]!.className.indexOf('user-last'));
  });

  it('style passthrough merge sau height lên host (override được)', () => {
    const { container } = render(<ShipModel height={240} style={{ height: '99px', margin: '8px' }} />);
    const host = container.firstElementChild as HTMLElement;
    expect(host.style.height).toBe('99px'); // consumer override thắng
    expect(host.style.margin).toBe('8px');
  });
});
