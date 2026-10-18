// QRCode tests — core matrix (cấu trúc spec QR: finder/timing/deterministic +
// UTF-8) và component SVG (render theo value, size, errorLevel, aria, không id).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { QRCode } from './index.js';
import { makeQrMatrix, matrixToPath } from './qrcode-core.js';

afterEach(cleanup);

describe('QRCode — core matrix (spec QR)', () => {
  it("'A' level M → version 1 (21×21), finder patterns ở 3 góc", () => {
    const m = makeQrMatrix('A', 'M');
    expect(m.count).toBe(21); // 4×1 + 17
    // finder = viền 7×7 đậm tại top-left, top-right, bottom-left
    for (const [r, c] of [[0, 0], [0, 20], [20, 0]] as const) {
      expect(m.isDark(r, c)).toBe(true);
    }
    // separator ngay ngoài finder phải SÁNG
    expect(m.isDark(7, 7)).toBe(false);
    expect(m.isDark(7, 13)).toBe(false);
  });

  it('timing pattern row/col 6 đậm–sáng xen kẽ', () => {
    const m = makeQrMatrix('https://demo.local/tasks', 'Q');
    for (let c = 8; c < m.count - 8; c += 2) {
      expect(m.isDark(6, c)).toBe(true);
      expect(m.isDark(6, c + 1)).toBe(false);
    }
    for (let r = 8; r < m.count - 8; r += 2) {
      expect(m.isDark(r, 6)).toBe(true);
      expect(m.isDark(r + 1, 6)).toBe(false);
    }
  });

  it('deterministic: cùng value + level → cùng matrix; khác level → khác mật độ EC', () => {
    const a = matrixToPath(makeQrMatrix('hello', 'L'));
    const b = matrixToPath(makeQrMatrix('hello', 'L'));
    expect(a).toBe(b);
    // H sửa lỗi nhiều hơn → data giãn ra, matrix nhiều module khác L (không assert
    // chiều, chỉ assert khác nhau — bảo vệ regress đổi nhầm level mapping)
    expect(matrixToPath(makeQrMatrix('hello', 'H'))).not.toBe(a);
  });

  it('UTF-8: text tiếng Việt có dấu mã hoá được (không crash, khác ASCII)', () => {
    const m = makeQrMatrix('Thanh toán đơn hàng #123', 'M');
    expect(m.count).toBeGreaterThan(21);
    expect(matrixToPath(m)).toMatch(/^M\d+ \d+h1v1h-1z/);
  });
});

describe('QRCode — component SVG', () => {
  it('render svg với data: role=img + aria-label theo value + path module đậm', () => {
    render(<QRCode value="https://demo.local/pay/abc" />);
    const svg = screen.getByRole('img', { name: 'QR code for https://demo.local/pay/abc' });
    expect(svg.tagName).toBe('svg');
    const path = svg.querySelector('path')!;
    expect(path.getAttribute('d')!.length).toBeGreaterThan(100); // nhiều module đậm
  });

  it('value đổi → matrix đổi (path d khác)', () => {
    const { rerender } = render(<QRCode value="first-value" />);
    const d1 = screen.getByRole('img').querySelector('path')!.getAttribute('d');
    rerender(<QRCode value="second-value" />);
    const d2 = screen.getByRole('img').querySelector('path')!.getAttribute('d');
    expect(d1).not.toBe(d2);
  });

  it('size prop reflect vào width/height svg', () => {
    const { rerender } = render(<QRCode value="s" size={96} />);
    let svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('width', '96');
    expect(svg).toHaveAttribute('height', '96');
    rerender(<QRCode value="s" size={240} />);
    svg = screen.getByRole('img');
    expect(svg).toHaveAttribute('width', '240');
  });

  it('errorLevel L/M/Q/H đều nhận (render không lỗi, deterministic theo level)', () => {
    for (const level of ['L', 'M', 'Q', 'H'] as const) {
      const { unmount } = render(<QRCode value={`level-${level}`} errorLevel={level} />);
      expect(screen.getByRole('img', { name: `QR code for level-${level}` })).toBeInTheDocument();
      unmount();
    }
  });

  it('aria unique theo value; SVG không sinh id → 2 instance không đụng id', () => {
    render(
      <div>
        <QRCode value="alpha" />
        <QRCode value="beta" />
      </div>,
    );
    expect(screen.getByRole('img', { name: 'QR code for alpha' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR code for beta' })).toBeInTheDocument();
    const ids = document.querySelectorAll('[id]');
    expect(ids).toHaveLength(0); // không id → không thể trùng
  });

  it('tokens màu mặc định: bg var(--c-s1), fg var(--ink); override được qua props', () => {
    const { rerender } = render(<QRCode value="c" />);
    let svg = screen.getByRole('img');
    expect(svg.querySelector('rect')!.getAttribute('fill')).toBe('var(--c-s1)');
    expect(svg.querySelector('path')!.getAttribute('fill')).toBe('var(--ink)');
    rerender(<QRCode value="c" bgColor="#fff" fgColor="#000" />);
    svg = screen.getByRole('img');
    expect(svg.querySelector('rect')!.getAttribute('fill')).toBe('#fff');
    expect(svg.querySelector('path')!.getAttribute('fill')).toBe('#000');
  });

  it('title override aria-label', () => {
    render(<QRCode value="x" title="Mã thanh toán" />);
    expect(screen.getByRole('img', { name: 'Mã thanh toán' })).toBeInTheDocument();
  });
});
