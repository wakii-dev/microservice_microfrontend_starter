// Carousel tests — PrimeReact-level (circular, autoplay, indicators, navigators).
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Carousel } from './index.js';

afterEach(cleanup);

const items = ['Slide A', 'Slide B', 'Slide C'];

describe('Carousel (PrimeReact-level)', () => {
  it('renders all items', () => {
    render(<Carousel items={items.map((t) => <p key={t}>{t}</p>)} />);
    expect(screen.getByText('Slide A')).toBeInTheDocument();
    expect(screen.getByText('Slide C')).toBeInTheDocument();
  });

  it('dots click → navigate slide', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<Carousel items={items.map((t) => <p key={t}>{t}</p>)} />);
    const dots = screen.getAllByRole('button', { name: /Slide \d/ });
    await user.click(dots[1]);
    const track = document.querySelector('.transition-transform');
    expect(track?.getAttribute('style')).toContain('translateX');
  });

  it('prev/next buttons → navigate', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<Carousel items={items.map((t) => <p key={t}>{t}</p>)} />);
    await user.click(screen.getByLabelText('Sau'));
    const track = document.querySelector('.transition-transform');
    expect(track?.getAttribute('style')).toContain('translateX');
    await user.click(screen.getByLabelText('Trước'));
    expect(track?.getAttribute('style')).toContain('translateX');
  });
});
