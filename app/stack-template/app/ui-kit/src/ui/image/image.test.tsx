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

  it('width string → passthrough nguyên văn (%, ch)', () => {
    render(<UiImage src="/b.png" alt="b" width="50%" />);
    expect(screen.getByRole('button', { name: 'b — phóng to' })).toHaveAttribute('width', '50%');
  });
});

describe('UiImage — preview dialog (a11y batch F)', () => {
  it('overlay là dialog: role=dialog + aria-modal + aria-label=alt', async () => {
    const user = userEvent.setup();
    render(<UiImage src="/a.png" alt="Ảnh demo" />);
    await user.click(screen.getByRole('button', { name: 'Ảnh demo — phóng to' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Ảnh demo');
  });

  it('click overlay → đóng preview', async () => {
    const user = userEvent.setup();
    render(<UiImage src="/a.png" alt="Ảnh demo" />);
    await user.click(screen.getByRole('button', { name: 'Ảnh demo — phóng to' }));
    await user.click(screen.getByRole('dialog'));
    expect(document.querySelector('[data-testid="image-preview"]')).toBeNull();
  });

  it('focus trap: mở → focus overlay, đóng → trả focus về thumbnail', async () => {
    const user = userEvent.setup();
    render(<UiImage src="/a.png" alt="Ảnh demo" />);
    const thumb = screen.getByRole('button', { name: 'Ảnh demo — phóng to' });
    await user.click(thumb);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus(); // không focusable bên trong → focus chính overlay
    // Tab vòng trong — focus không thoát khỏi dialog
    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(thumb).toHaveFocus(); // trả focus về trigger
  });
});
