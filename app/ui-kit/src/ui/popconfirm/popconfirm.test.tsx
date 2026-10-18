// Popconfirm tests — controlled open, ok/cancel/ESC, danger icon, dialog a11y
// (role=dialog + aria-label + trigger aria-haspopup/aria-expanded), edge description omitted.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Popconfirm } from './index.js';

afterEach(cleanup);

describe('Popconfirm', () => {
  it('open=false → chỉ trigger, không bubble; trigger aria-expanded=false', () => {
    render(
      <Popconfirm open={false} title="Xoá?" onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Xoá?')).toBeNull();
  });

  it('open → bubble title + icon warning mặc định (không danger) + role=dialog có label', () => {
    render(
      <Popconfirm open title="Xoá task này?" onConfirm={vi.fn()} onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(screen.getByText('Xoá task này?')).toBeInTheDocument();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).toHaveAttribute('aria-label', 'Xoá task này?');
    // icon mặc định = vàng warning (không danger)
    expect(document.querySelector('.bg-st-doing')).not.toBeNull();
    expect(document.querySelector('.bg-st-fail')).toBeNull();
  });

  it('trigger open → aria-expanded=true + aria-haspopup=dialog (cloneElement wire)', () => {
    render(
      <Popconfirm open title="?" onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
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

  it('okText/cancelText tuỳ biến → nhãn nút đúng', () => {
    render(
      <Popconfirm open title="Gửi?" okText="Gửi luôn" cancelText="Để sau" onConfirm={vi.fn()} onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(screen.getByRole('button', { name: 'Gửi luôn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Để sau' })).toBeInTheDocument();
  });

  it('description phụ hiển thị', () => {
    render(
      <Popconfirm open title="Xoá?" description="Không thể hoàn tác" onConfirm={vi.fn()} onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(screen.getByText('Không thể hoàn tác')).toBeInTheDocument();
  });

  it('không description → không render dòng mô tả (branch omitted)', () => {
    render(
      <Popconfirm open title="Xoá?" onConfirm={vi.fn()} onCancel={vi.fn()}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    expect(screen.queryByText('Không thể hoàn tác')).toBeNull();
    expect(document.querySelectorAll('.text-label.text-ink2')).toHaveLength(0);
  });

  it('ESC không mở → không listener lỗi (open=false ESC không gọi onCancel)', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <Popconfirm open={false} title="Xoá?" onCancel={onCancel}>
        <button>Trigger</button>
      </Popconfirm>,
    );
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });
});
