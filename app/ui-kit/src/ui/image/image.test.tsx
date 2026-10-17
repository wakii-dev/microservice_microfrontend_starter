// Image tests — img render + preview portal + ESC đóng.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { UiImage } from './index.js';

afterEach(cleanup);

describe('UiImage', () => {
  it('img render với alt + width', () => {
    render(<UiImage src="/a.png" alt="Ảnh demo" width={200} />);
    expect(screen.getByRole('img', { name: 'Ảnh demo' })).toHaveAttribute('width', '200');
  });

  it('click → preview portal; ESC đóng', async () => {
    const user = userEvent.setup();
    render(<UiImage src="/a.png" alt="Ảnh demo" />);
    await user.click(screen.getByRole('img', { name: 'Ảnh demo' }));
    expect(document.querySelector('[data-testid="image-preview"]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(document.querySelector('[data-testid="image-preview"]')).toBeNull();
  });
});

describe('UiImage — branch phụ', () => {
  it('width undefined + className → img không width attr', () => {
    render(<UiImage src="/b.png" alt="b" className="marker-img" />);
    const img = screen.getByRole('img', { name: 'b' });
    expect(img).not.toHaveAttribute('width');
    expect(img).toHaveClass('marker-img');
  });
});
