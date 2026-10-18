// ScrollPanel tests — render children, height prop/mặc định, className merge,
// overflow + scrollbar styling.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ScrollPanel } from './index.js';

afterEach(cleanup);

describe('ScrollPanel', () => {
  it('render children bên trong', () => {
    render(
      <ScrollPanel>
        <p>Nội dung dài</p>
        <p>Dòng thứ hai</p>
      </ScrollPanel>,
    );
    expect(screen.getByText('Nội dung dài')).toBeInTheDocument();
    expect(screen.getByText('Dòng thứ hai')).toBeInTheDocument();
  });

  it('height prop → style height; mặc định 200px', () => {
    const { container, rerender } = render(
      <ScrollPanel><span /></ScrollPanel>,
    );
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.style.height).toBe('200px');
    rerender(<ScrollPanel height="350px"><span /></ScrollPanel>);
    expect(panel.style.height).toBe('350px');
  });

  it('container overflow-auto + scrollbar mảnh; className merge ngoài', () => {
    const { container } = render(
      <ScrollPanel height="120px" className="mt-4"><span /></ScrollPanel>,
    );
    const panel = container.firstElementChild as HTMLElement;
    expect(panel).toHaveClass('overflow-auto');
    expect(panel).toHaveClass('rounded-xl');
    expect(panel.className).toContain('scrollbar-width:thin');
    expect(panel).toHaveClass('mt-4');
  });
});
