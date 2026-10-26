import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Toolbar } from './index.js';
afterEach(cleanup);
describe('Toolbar', () => {
  it('children + extra render', () => {
    render(<Toolbar extra={<span>extra</span>}>main</Toolbar>);
    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('extra')).toBeInTheDocument();
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Toolbar — classNames slots + style', () => {
  it('slots root/start/end lên đúng element; className sau root slot', () => {
    const { container } = render(
      <Toolbar extra={<span>right</span>} classNames={{ root: 'slot-root', start: 'slot-start', end: 'slot-end' }} className="user-last">
        <span>left</span>
      </Toolbar>,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveClass('slot-root');
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
    expect(screen.getByText('left').parentElement).toHaveClass('slot-start');
    expect(screen.getByText('right').parentElement).toHaveClass('slot-end');
  });

  it('style passthrough lên div gốc', () => {
    const { container } = render(<Toolbar style={{ padding: '2px' }}>x</Toolbar>);
    expect(container.firstElementChild).toHaveStyle({ padding: '2px' });
  });
});
