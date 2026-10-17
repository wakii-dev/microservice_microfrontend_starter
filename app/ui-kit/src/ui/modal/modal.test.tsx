// Modal tests — portal body, open/close, ESC, overlay click, ok/cancel, confirmLoading
// (+ focus management batch ⑫: trap Tab, focus-first, trả focus trigger).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './index.js';

afterEach(cleanup);

describe('Modal', () => {
  it('open=false → không render gì', () => {
    render(<Modal open={false} title="Xoá task này?" />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('open → portal body: role=dialog + title + nội dung', () => {
    render(
      <Modal open title="Xoá task này?" danger okText="Xác nhận xoá">
        Hành động không thể hoàn tác.
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Xoá task này?')).toBeInTheDocument();
    expect(screen.getByText('Hành động không thể hoàn tác.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xác nhận xoá' }).className).toContain('bg-st-fail');
  });

  it('nút OK → onOk; Huỷ/overlay/ESC → onCancel', async () => {
    const onOk = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal open title="t" onOk={onOk} onCancel={onCancel} />,
    );
    await user.click(screen.getByRole('button', { name: 'OK' }));
    expect(onOk).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId('modal-overlay'));
    expect(onCancel).toHaveBeenCalledTimes(2);
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it('confirmLoading → nút disable + text Đang xử lý…', () => {
    render(
      <Modal open title="t" okText="Xác nhận xoá" confirmLoading />,
    );
    const ok = screen.getByRole('button', { name: 'Đang xử lý…' });
    expect(ok).toBeDisabled();
  });
});

describe('Modal — branch phụ (Tier 2)', () => {
  it('title ReactNode (không string) → không aria-label, vẫn render node', () => {
    render(
      <Modal
        open
        title={
          <strong>
            <span data-testid="node-title">Xoá?</span>
          </strong>
        }
      />,
    );
    expect(screen.getByTestId('node-title')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
  });

  it('không children → chỉ title + actions', () => {
    render(<Modal open title="Chỉ title" />);
    expect(screen.getByText('Chỉ title')).toBeInTheDocument();
  });
});

describe('Modal — focus management (a11y batch ⑫ worker C)', () => {
  function FocusHost({ onCancel }: { onCancel: () => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Mở modal</button>
        <Modal
          open={open}
          title="Xoá task?"
          onCancel={() => { onCancel(); setOpen(false); }}
        />
      </>
    );
  }

  const openModal = async (onCancel = vi.fn()) => {
    const user = userEvent.setup();
    render(<FocusHost onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Mở modal' }));
    return { user, onCancel };
  };

  it('mở → focus phần tử focusable đầu (nút Huỷ)', async () => {
    await openModal();
    expect(screen.getByRole('button', { name: 'Huỷ' })).toHaveFocus();
  });

  it('Tab ở nút cuối (OK) → vòng về đầu, KHÔNG thoát ra ngoài dialog', async () => {
    await openModal();
    screen.getByRole('button', { name: 'OK' }).focus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Huỷ' })).toHaveFocus();
  });

  it('Shift+Tab ở phần tử đầu → vòng về cuối', async () => {
    await openModal(); // focus đang ở Huỷ (đầu)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'OK' })).toHaveFocus();
  });

  it('ESC → gọi onCancel', async () => {
    const { onCancel } = await openModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('đóng → focus TRẢ VỀ trigger (Mở modal)', async () => {
    const { user } = await openModal();
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(screen.getByRole('button', { name: 'Mở modal' })).toHaveFocus();
  });
});
