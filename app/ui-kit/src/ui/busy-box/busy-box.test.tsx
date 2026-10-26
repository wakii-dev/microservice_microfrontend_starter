// BusyBox tests — busy/idle switch + variant passthrough.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BusyBox } from './index.js';

afterEach(cleanup);

describe('BusyBox', () => {
  it('busy=true → Skeleton thay content (aria-busy)', () => {
    const { container } = render(
      <BusyBox busy variant="card" count={2}>
        <p>content</p>
      </BusyBox>,
    );
    expect(screen.queryByText('content')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(container.querySelectorAll('.rounded-xl')).toHaveLength(2);
  });

  it('busy=false → content render, không skeleton', () => {
    render(
      <BusyBox busy={false}>
        <p>content</p>
      </BusyBox>,
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });
});

// ── slots-wave: classNames slot + style passthrough ──

describe('BusyBox — classNames + style', () => {
  it('slot root lên cả 2 nhánh (busy + idle); className sau slot', () => {
    const { container, rerender } = render(
      <BusyBox busy classNames={{ root: 'slot-root' }} className="user-last">
        <p>busy</p>
      </BusyBox>,
    );
    const busyRoot = container.firstElementChild!;
    expect(busyRoot).toHaveClass('slot-root');
    expect(busyRoot.className.indexOf('slot-root')).toBeLessThan(busyRoot.className.indexOf('user-last'));
    rerender(
      <BusyBox busy={false} classNames={{ root: 'slot-root' }} className="user-last">
        <p>idle</p>
      </BusyBox>,
    );
    expect(container.firstElementChild).toHaveClass('slot-root');
  });

  it('style passthrough lên root (cả 2 nhánh)', () => {
    const { container, rerender } = render(
      <BusyBox busy style={{ margin: '8px' }}>
        <p>x</p>
      </BusyBox>,
    );
    expect(container.firstElementChild).toHaveStyle({ margin: '8px' });
    rerender(
      <BusyBox busy={false} style={{ margin: '8px' }}>
        <p>x</p>
      </BusyBox>,
    );
    expect(container.firstElementChild).toHaveStyle({ margin: '8px' });
  });
});
