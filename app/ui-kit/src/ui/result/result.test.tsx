// Result tests — 6 status (icon/màu/defaultTitle), override title/subTitle/extra, children, className.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Result } from './index.js';

afterEach(cleanup);

describe('Result', () => {
  it('success → check-draw svg + title mặc định (motion waves: stroke vẽ tay)', () => {
    render(<Result status="success" />);
    expect(screen.getByText('Thành công')).toBeInTheDocument();
    const check = document.querySelector('[data-testid="result-check"]');
    expect(check).not.toBeNull();
    expect(check).toHaveAttribute('aria-hidden', 'true');
  });

  it('title/subTitle/extra override + children', () => {
    render(
      <Result status="404" title="404" subTitle="Trang không tồn tại" extra={<button>Về chủ</button>}>
        <p>detail</p>
      </Result>,
    );
    expect(screen.getAllByText('404').length).toBeGreaterThanOrEqual(1); // icon + title đều "404"
    expect(screen.getByText('Trang không tồn tại')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về chủ' })).toBeInTheDocument();
    expect(screen.getByText('detail')).toBeInTheDocument();
  });

  it.each([
    ['success', 'Thành công', 'text-st-done'],
    ['error', 'Có lỗi xảy ra', 'text-st-fail'],
    ['info', 'Thông tin', 'text-ink'],
    ['warning', 'Cảnh báo', 'text-st-doing'],
    ['404', 'Không tìm thấy trang', 'text-ink'],
    ['500', 'Lỗi máy chủ', 'text-ink'],
  ] as const)('status %s → defaultTitle + màu icon đúng', (status, defaultTitle, colorCls) => {
    render(<Result status={status} />);
    expect(screen.getByText(defaultTitle)).toBeInTheDocument();
    if (status === 'success') {
      // success dùng check-draw svg (motion waves) — màu nằm trên svg
      expect(document.querySelector('[data-testid="result-check"]')).toHaveClass('text-st-done');
    } else {
      expect(document.querySelector('.text-5xl')?.className).toContain(colorCls);
    }
  });

  it('icon là aria-hidden (decorative)', () => {
    render(<Result status="error" />);
    expect(document.querySelector('.text-5xl')).toHaveAttribute('aria-hidden', 'true');
  });

  it('className passthrough', () => {
    render(<Result status="info" className="pt-4" />);
    expect(document.querySelector('.pt-4.text-center')).not.toBeNull();
  });
});
