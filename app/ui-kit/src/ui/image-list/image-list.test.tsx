// ImageList — standard grid vs masonry columns, captions, keyboard activation.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageList } from './index.js';

afterEach(cleanup);

const items = [
  { src: 'https://picsum.photos/seed/a/300/200', alt: 'A' },
  { src: 'https://picsum.photos/seed/b/300/300', alt: 'B' },
  { src: 'https://picsum.photos/seed/c/300/160', alt: 'C', caption: 'Third' },
];

describe('ImageList', () => {
  it('standard — grid template with cols + rowHeight images', () => {
    const { container } = render(<ImageList items={items} cols={3} gap={8} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('grid');
    expect(root.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(container.querySelectorAll('figure')).toHaveLength(3);
    expect((container.querySelector('img') as HTMLImageElement).style.height).toBe('160px');
  });

  it('masonry — CSS column-count + break-inside-avoid', () => {
    const { container } = render(<ImageList items={items} cols={2} variant="masonry" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.columnCount).toBe('2');
    expect((container.querySelector('figure') as HTMLElement).className).toContain('break-inside-avoid');
  });

  it('alt + caption render', () => {
    const { container } = render(<ImageList items={items} />);
    const alts = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('alt'));
    expect(alts).toEqual(['A', 'B', 'C']);
    expect(container.querySelector('figcaption')!.textContent).toBe('Third');
  });

  it('keyboard Enter triggers onItemClick', () => {
    const onPick = vi.fn();
    const { container } = render(<ImageList items={items} onItemClick={onPick} />);
    const fig = container.querySelector('figure') as HTMLElement;
    fig.focus();
    fireEvent.keyDown(fig, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledWith(0);
  });

  it('renderItem overrides the tile', () => {
    render(<ImageList items={items} renderItem={(it) => <div key={it.alt}>{`custom-${it.alt}`}</div>} />);
    expect(screen.getByText('custom-A')).toBeInTheDocument();
  });
});
