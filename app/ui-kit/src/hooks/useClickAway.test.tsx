// Tests useClickAway — fireEvent mousedown NGOÀI / TRONG (spec worker B).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useClickAway } from './useClickAway.js';

function Box({ onClickAway }: { onClickAway: (event: MouseEvent | TouchEvent) => void }) {
  const ref = useClickAway<HTMLDivElement>(onClickAway);
  return (
    <div>
      <div ref={ref} data-testid="inside" />
      <div data-testid="outside" />
    </div>
  );
}

afterEach(cleanup);

describe('useClickAway', () => {
  it('mousedown NGOÀI → gọi handler; TRONG → không gọi', () => {
    const handler = vi.fn();
    render(<Box onClickAway={handler} />);

    fireEvent.mouseDown(screen.getByTestId('inside'));
    expect(handler).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });

  it('mousedown trên chính phần tử ref (không phải con) → không gọi', () => {
    const handler = vi.fn();
    render(<Box onClickAway={handler} />);

    // 'inside' chính là element mang ref — contains(target) với target === el
    fireEvent.mouseDown(screen.getByTestId('inside'), { detail: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('touchstart NGOÀI cũng kích hoạt (mobile)', () => {
    const handler = vi.fn();
    render(<Box onClickAway={handler} />);

    fireEvent.touchStart(screen.getByTestId('outside'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('unmount gỡ listener — không gọi nữa', () => {
    const handler = vi.fn();
    // phần tử "ngoài" đặt ngoài cây render — unmount remove cả cây Box thì nó vẫn còn
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    try {
      const { unmount } = render(<Box onClickAway={handler} />);

      unmount();
      fireEvent.mouseDown(outside);
      expect(handler).not.toHaveBeenCalled();
    } finally {
      outside.remove();
    }
  });
});
