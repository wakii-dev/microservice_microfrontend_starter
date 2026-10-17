import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Galleria } from './index.js';
afterEach(cleanup);

const IMAGES = [
  { src: '/a.png', alt: 'a' },
  { src: '/b.png', alt: 'b', caption: 'Caption B' },
];

describe('Galleria', () => {
  it('renders images + captions + dots', () => {
    render(<Galleria images={IMAGES} />);
    expect(screen.getByAltText('a')).toBeInTheDocument();
    expect(screen.getByAltText('b')).toBeInTheDocument();
    expect(screen.getByText('Caption B')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Ảnh/ }).length).toBe(2);
  });
});
