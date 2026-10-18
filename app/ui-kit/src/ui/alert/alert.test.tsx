// Alert tests — filled mặc định (nền đặc hex + chữ trắng) + outlined giữ look cũ + role=alert contract.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Alert } from './index.js';

afterEach(cleanup);

// jsdom (cssstyle) chuẩn hoá hex → rgb khi áp inline style
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

describe('Alert', () => {
  it('mặc định info filled — role=alert + message + nền đặc', () => {
    render(<Alert message="Không kết nối được dịch vụ tasks." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Không kết nối được dịch vụ tasks.');
    expect(screen.getByRole('alert').style.background).toContain(rgb('#1677ff'));
  });

  it.each([
    ['error', '#cf1322'],
    ['warning', '#d48806'],
    ['success', '#389e0d'],
  ] as const)('type %s filled mặc định → nền đặc hex, không viền, chữ + icon trắng', (type, bg) => {
    render(<Alert type={type} message="m" />);
    const alert = screen.getByRole('alert');
    expect(alert.style.background).toContain(rgb(bg));
    expect(alert).not.toHaveClass('border');
    // icon span trắng — phần tử aria-hidden đầu
    expect(alert.firstElementChild).toHaveClass('text-white');
  });

  it.each([
    ['success', '--alert-success-bg', '--alert-success-border', 'text-st-done'],
    ['info', '--alert-info-bg', '--alert-info-border', 'text-accent'],
    ['warning', '--alert-warning-bg', '--alert-warning-border', 'text-st-doing'],
    ['error', '--alert-error-bg', '--alert-error-border', 'text-st-fail'],
  ] as const)('variant outlined → %s giữ look cũ: bg/border qua CSS var + icon màu riêng', (type, bgVar, borderVar, iconCls) => {
    render(<Alert type={type} variant="outlined" message="m" />);
    const alert = screen.getByRole('alert');
    expect(alert.style.background).toContain(bgVar);
    expect(alert.style.borderColor).toContain(borderVar);
    expect(alert).toHaveClass('border');
    expect(alert.firstElementChild).toHaveClass(iconCls);
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
