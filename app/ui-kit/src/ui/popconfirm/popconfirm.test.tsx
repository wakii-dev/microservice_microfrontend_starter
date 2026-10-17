// Popconfirm tests — controlled open, ok/cancel, ESC, danger icon.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Popconfirm } from './index.js';

afterEach(cleanup);

describe('Popconfirm', () => {
  it('open=false → chỉ trigger, không bubble', () => {
    render(
      <Popconfirm open={false} title="Xoá?" onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    expect(screen.queryByText('Xoá?')).toBeNull();
  });

  it('open → bubble title + icon warning mặc định (không danger)', () => {
    render(
      <Popconfirm open title="Xoá task này?" onConfirm={vi.fn()} onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(screen.getByText('Xoá task này?')).toBeInTheDocument();
    // icon mặc định = vàng warning (không danger)
    expect(document.querySelector('.bg-st-doing')).not.toBeNull();
    expect(document.querySelector('.bg-st-fail')).toBeNull();
  });

  it('danger → icon đỏ; OK gọi onConfirm; Huỷ/ESC gọi onCancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <Popconfirm open title="Xoá?" danger okText="Xác nhận xoá" onConfirm={onConfirm} onCancel={onCancel}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(document.querySelector('.bg-st-fail')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('description phụ hiển thị', () => {
    render(
      <Popconfirm open title="Xoá?" description="Không thể hoàn tác" onConfirm={vi.fn()} onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(screen.getByText('Không thể hoàn tác')).toBeInTheDocument();
  });
});
