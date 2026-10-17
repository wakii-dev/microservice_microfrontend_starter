// Modal tests — portal body, open/close, ESC, overlay click, ok/cancel, confirmLoading.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
