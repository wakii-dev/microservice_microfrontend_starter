// Image tests — img render + preview portal + ESC đóng (+ keyboard mở preview batch ⑫).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { UiImage } from './index.js';

afterEach(cleanup);

describe('UiImage', () => {
  it('img render với alt + width (role button vì click mở preview — batch ⑫)', () => {
    render(<UiImage src="/a.png" alt="Ảnh demo" width={200} />);
    const img = screen.getByRole('button', { name: 'Ảnh demo — phóng to' });
    expect(img).toHaveAttribute('width', '200');
    expect(img).toHaveAttribute('alt', 'Ảnh demo');
  });

  it('click → preview portal; ESC đóng', async () => {
    const user = userEvent.setup();
    render(<UiImage src="/a.png" alt="Ảnh demo" />);
    await user.click(screen.getByRole('button', { name: 'Ảnh demo — phóng to' }));
    expect(document.querySelector('[data-testid="image-preview"]')).not.toBeNull();
    await user.keyboard('{Escape}');
    expect(document.querySelector('[data-testid="image-preview"]')).toBeNull();
  });

  it('keyboard: Enter/Space mở preview (a11y batch ⑫)', () => {
    render(<UiImage src="/a.png" alt="Ảnh demo" />);
    const img = screen.getByRole('button', { name: 'Ảnh demo — phóng to' });
    fireEvent.keyDown(img, { key: 'Enter' });
    expect(document.querySelector('[data-testid="image-preview"]')).not.toBeNull();
  });
});

describe('UiImage — branch phụ', () => {
  it('width undefined + className → img không width attr', () => {
    render(<UiImage src="/b.png" alt="b" className="marker-img" />);
    const img = screen.getByRole('button', { name: 'b — phóng to' });
    expect(img).not.toHaveAttribute('width');
    expect(img).toHaveClass('marker-img');
  });
});
