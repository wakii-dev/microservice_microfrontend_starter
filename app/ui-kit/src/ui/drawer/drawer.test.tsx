// Drawer tests — portal, open/close, ESC, mask click, footer
// (+ focus management batch ⑫: trap Tab, focus-first, trả focus trigger).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
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

describe('Drawer — branch phụ (Tier 5 sweep)', () => {
  it('không footer prop → không render footer element', () => {
    render(<Drawer open title="Không footer" />);
    expect(screen.getByRole('dialog', { name: 'Không footer' })).toBeInTheDocument();
    // footer element = block cuối có border-t — không truyền footer thì không có
    expect(document.querySelector('.border-t.border-line2.p-4')).toBeNull();
  });
});

describe('Drawer — focus management (a11y batch ⑫ worker C)', () => {
  function DrawerHost({ onClose }: { onClose: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Mở drawer</button>
        <Drawer
          open={open}
          title="Chi tiết"
          onClose={() => { onClose(); setOpen(false); }}
          footer={<button onClick={() => setOpen(false)}>Lưu</button>}
        >
          Nội dung drawer
        </Drawer>
      </>
    );
  }

  const openDrawer = async (onClose = vi.fn()) => {
    const user = userEvent.setup();
    render(<DrawerHost onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Mở drawer' }));
    return { user, onClose };
  };

  it('mở → focus phần tử focusable đầu (nút × Đóng)', async () => {
    await openDrawer();
    expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus();
  });

  it('Tab ở phần tử cuối (Lưu) → vòng về đầu, KHÔNG thoát ra ngoài panel', async () => {
    await openDrawer();
    screen.getByRole('button', { name: 'Lưu' }).focus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Đóng' })).toHaveFocus();
  });

  it('Shift+Tab ở phần tử đầu → vòng về cuối', async () => {
    await openDrawer(); // focus đang ở Đóng (đầu)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Lưu' })).toHaveFocus();
  });

  it('ESC → gọi onClose', async () => {
    const { onClose } = await openDrawer();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('đóng → focus TRẢ VỀ trigger (Mở drawer)', async () => {
    const { user } = await openDrawer();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.getByRole('button', { name: 'Mở drawer' })).toHaveFocus();
  });
});

describe('Drawer — classNames slots (SÓNG-3)', () => {
  it('slots merge sau default ở đúng element (mask/wrapper/header/body/footer)', () => {
    render(
      <Drawer
        open
        title="Slot"
        footer={<button>Lưu</button>}
        classNames={{ mask: 'backdrop-blur-sm', wrapper: 'ring-1', header: 'bg-s3', body: 'italic', footer: 'border-t-0' }}
      >
        nội dung
      </Drawer>,
    );
    const mask = screen.getByTestId('drawer-overlay');
    expect(mask).toHaveClass('bg-[var(--mask)]'); // default giữ
    expect(mask).toHaveClass('backdrop-blur-sm'); // slot thêm
    const panel = screen.getByRole('dialog', { name: 'Slot' });
    expect(panel).toHaveClass('bg-s2');
    expect(panel).toHaveClass('ring-1');
    expect(panel.querySelector('header')).toHaveClass('bg-s3');
    expect(panel.querySelector('.flex-1')).toHaveClass('italic');
    expect(panel.querySelector('footer')).toHaveClass('border-t-0');
  });
});
