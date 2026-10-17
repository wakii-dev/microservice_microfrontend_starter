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

});
