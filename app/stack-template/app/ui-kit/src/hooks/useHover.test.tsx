// Tests useHover — mouseenter/mouseleave đổi trạng thái (spec worker B).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useHover } from './useHover.js';

function HoverArea() {
  const [ref, hovered] = useHover<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="area">
      {hovered ? 'hovering' : 'idle'}
    </div>
  );
}

afterEach(cleanup);

describe('useHover', () => {
  it('mouseenter → true, mouseleave → false', () => {
    render(<HoverArea />);
    const area = screen.getByTestId('area');

    expect(area).toHaveTextContent('idle');

    fireEvent.mouseEnter(area);
    expect(area).toHaveTextContent('hovering');

    fireEvent.mouseLeave(area);
    expect(area).toHaveTextContent('idle');
  });
});
