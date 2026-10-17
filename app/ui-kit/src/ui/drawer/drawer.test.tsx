// Drawer tests — portal, open/close, ESC, mask click, footer.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Drawer } from './index.js';

afterEach(cleanup);

describe('Drawer', () => {
  it('open=false → null; open → portal role=dialog + title', () => {
    const { baseElement } = render(<Drawer open={false} title="Chi tiết" />);
    expect(baseElement.querySelector('[role="dialog"]')).toBeNull();
    render(<Drawer open title="Chi tiết task">Nội dung drawer</Drawer>);
    expect(screen.getByRole('dialog', { name: 'Chi tiết task' })).toBeInTheDocument();
    expect(screen.getByText('Nội dung drawer')).toBeInTheDocument();
  });

  it('ESC + mask click + nút × → onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Drawer open title="D" onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId('drawer-overlay'));
    expect(onClose).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('footer render khi truyền', () => {
    render(<Drawer open title="D" footer={<button>Lưu</button>} />);
    expect(screen.getByRole('button', { name: 'Lưu' })).toBeInTheDocument();
  });
});

describe('Drawer — branch phụ', () => {
  it('width tuỳ ý → style áp lên aside', () => {
    render(<Drawer open title="Rộng" width={500} />);
    expect(screen.getByRole('dialog', { name: 'Rộng' }).style.width).toBe('500px');
  });
});
