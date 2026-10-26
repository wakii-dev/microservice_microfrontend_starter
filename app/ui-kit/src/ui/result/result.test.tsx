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
      // style sweep: icon = SVG bộ chung trong wrapper testid (404/500 giữ chữ số text)
      expect(document.querySelector('[data-testid="result-icon"]')?.className).toContain(colorCls);
    }
  });

  it('icon là aria-hidden (decorative)', () => {
    render(<Result status="error" />);
    expect(document.querySelector('[data-testid="result-icon"]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('className passthrough', () => {
    render(<Result status="info" className="pt-4" />);
    expect(document.querySelector('.pt-4.text-center')).not.toBeNull();
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Result — classNames + style', () => {
  it('slots lên đúng element: root/icon/title/subTitle/extra; className sau root slot', () => {
    render(
      <Result
        status="404"
        title="404"
        subTitle="Mất rồi"
        extra={<button>Về chủ</button>}
        classNames={{
          root: 'slot-root',
          icon: 'slot-icon',
          title: 'slot-title',
          subTitle: 'slot-subtitle',
          extra: 'slot-extra',
        }}
        className="user-last"
      />,
    );
    const root = document.querySelector('.slot-root')!;
    expect(root).toBeInTheDocument();
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
    expect(document.querySelector('[data-testid="result-icon"]')).toHaveClass('slot-icon');
    expect(screen.getAllByText('404').find((el) => el.classList.contains('slot-title'))).toHaveClass('slot-title');
    expect(screen.getByText('Mất rồi')).toHaveClass('slot-subtitle');
    expect(screen.getByRole('button', { name: 'Về chủ' }).parentElement).toHaveClass('slot-extra');
  });

  it('style passthrough lên root (mọi status đều nhận)', () => {
    const { rerender } = render(<Result status="success" style={{ margin: '8px' }} />);
    expect(document.querySelector('[data-testid="result-check"]')!.parentElement).toHaveStyle({ margin: '8px' });
    rerender(<Result status="error" style={{ margin: '8px' }} />);
    expect(document.querySelector('[data-testid="result-icon"]')!.parentElement).toHaveStyle({ margin: '8px' });
  });
});
