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
