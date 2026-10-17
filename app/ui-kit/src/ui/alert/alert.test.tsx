// Alert tests — type styles + closable + role=alert contract.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert } from './index.js';

afterEach(cleanup);

describe('Alert', () => {
  it('mặc định info — role=alert + message', () => {
    render(<Alert message="Không kết nối được dịch vụ tasks." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Không kết nối được dịch vụ tasks.');
    expect(screen.getByRole('alert').className).toContain('bg-alert-info-bg');
  });

  it.each([
    ['error', 'bg-alert-error-bg', 'text-st-fail'],
    ['warning', 'bg-alert-warning-bg', 'text-st-doing'],
    ['success', 'bg-alert-success-bg', 'text-st-done'],
  ] as const)('type %s → tint + icon màu riêng', (type, bg, iconColor) => {
    render(<Alert type={type} message="m" />);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain(bg);
    // icon span màu riêng — phần tử aria-hidden đầu
    expect(alert.firstElementChild).toHaveClass(iconColor);
  });

  it('closable → nút × gọi onClose', async () => {
    const onClose = vi.fn();
    render(<Alert message="m" closable onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('description phụ hiển thị khi truyền', () => {
    render(<Alert type="error" message="Lỗi" description="Chi tiết kỹ thuật" />);
    expect(screen.getByText('Chi tiết kỹ thuật')).toBeInTheDocument();
  });
});

describe('Alert — branch phụ (Tier 2)', () => {
  it('className passthrough + description omitted branch', () => {
    render(<Alert type="info" message="m" className="mb-2" />);
    expect(screen.getByRole('alert')).toHaveClass('mb-2');
    expect(screen.queryByText(/Chi tiết/)).toBeNull();
  });
});
