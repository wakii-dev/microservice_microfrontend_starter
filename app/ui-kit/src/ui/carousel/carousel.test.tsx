import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Carousel } from './index.js';
afterEach(cleanup);

describe('Carousel', () => {
  const items = ['Slide A', 'Slide B', 'Slide C'];

  it('renders all items', () => {
    render(<Carousel items={items.map((t) => <p key={t}>{t}</p>)} />);
    expect(screen.getByText('Slide A')).toBeInTheDocument();
    expect(screen.getByText('Slide C')).toBeInTheDocument();
  });
  it('dots navigate', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<Carousel items={items.map((t) => <p key={t}>{t}</p>)} />);
    await user.click(screen.getByLabelText('Slide 2'));
    const track = document.querySelector('.transition-transform');
    expect(track?.getAttribute('style')).toContain('translateX(-100%)');
  });
  it('prev/next buttons', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<Carousel items={items.map((t) => <p key={t}>{t}</p>)} />);
    await user.click(screen.getByLabelText('Sau'));
    expect(document.querySelector('.transition-transform')?.getAttribute('style')).toContain('translateX(-100%)');
  });
});
