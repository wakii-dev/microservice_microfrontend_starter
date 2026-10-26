import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Splitter } from './index.js';
afterEach(cleanup);

describe('Splitter', () => {
  it('2 panels + separator', () => {
    render(
      <Splitter first={<div>Panel 1</div>} second={<div>Panel 2</div>} defaultSize={60} />,
    );
    expect(screen.getByText('Panel 1')).toBeInTheDocument();
    expect(screen.getByText('Panel 2')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
  it('direction vertical → flex-col', () => {
    const { container } = render(
      <Splitter direction="vertical" first={<div>A</div>} second={<div>B</div>} />,
    );
    expect(container.firstElementChild).toHaveClass('flex-col');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Splitter — classNames slots + style', () => {
  it('slots root/first/divider/second lên đúng element; className sau root slot', () => {
    const { container } = render(
      <Splitter
        first={<span data-testid="first">A</span>}
        second={<span data-testid="second">B</span>}
        classNames={{ root: 'slot-root', first: 'slot-first', divider: 'slot-divider', second: 'slot-second' }}
        className="user-last"
      />,
    );
    const root = container.firstElementChild!;
    expect(root).toHaveClass('slot-root');
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
    expect(screen.getByTestId('first').parentElement).toHaveClass('slot-first');
    expect(root.querySelector('[role="separator"]')).toHaveClass('slot-divider');
    expect(screen.getByTestId('second').parentElement).toHaveClass('slot-second');
  });

  it('style passthrough lên div gốc', () => {
    const { container } = render(<Splitter first="A" second="B" style={{ padding: '2px' }} />);
    expect(container.firstElementChild).toHaveStyle({ padding: '2px' });
  });
});
