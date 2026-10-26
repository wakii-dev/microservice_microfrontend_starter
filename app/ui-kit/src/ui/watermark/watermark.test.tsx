// Watermark tests — render children, data-URI tile trong style, content đổi → URL
// đổi, pointer-events-none, custom rotate/opacity/zIndex/left-top reflect trong DOM.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { Watermark } from './index.js';

afterEach(cleanup);

/** Lấy data-URI tile từ overlay (span aria-hidden duy nhất trong container). */
const overlayOf = (c: HTMLElement) => c.querySelector('span[aria-hidden]') as HTMLElement;
const tileUrlOf = (c: HTMLElement) => overlayOf(c).style.backgroundImage;

describe('Watermark', () => {
  it('render children bình thường (overlay không chặn nội dung)', () => {
    render(
      <Watermark content="CONFIDENTIAL">
        <p>Body content</p>
      </Watermark>,
    );
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('Body content').parentElement).toHaveClass('relative'); // container bao
  });

  it('overlay có data:image/svg+xml data-URI trong backgroundImage + repeat', () => {
    const { container } = render(
      <Watermark content="INTERNAL">
        <div>doc</div>
      </Watermark>,
    );
    const url = tileUrlOf(container);
    expect(url).toContain('data:image/svg+xml;charset=utf-8,');
    expect(url).toContain('INTERNAL'); // chữ nằm trong SVG tile
    expect(overlayOf(container).style.backgroundRepeat).toBe('repeat');
  });

  it('content đổi → data-URI đổi (re-bake tile)', () => {
    const { rerender, container } = render(
      <Watermark content="DRAFT v1">
        <div>doc</div>
      </Watermark>,
    );
    const before = tileUrlOf(container);
    rerender(
      <Watermark content="DRAFT v2">
        <div>doc</div>
      </Watermark>,
    );
    const after = tileUrlOf(container);
    expect(before).not.toBe(after);
    expect(after).toContain('DRAFT%20v2');
  });

  it('overlay pointer-events-none + aria-hidden (children vẫn tương tác được)', () => {
    const { container } = render(
      <Watermark content="w">
        <button>Click</button>
      </Watermark>,
    );
    const overlay = overlayOf(container);
    expect(overlay.className).toContain('pointer-events-none');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    // overlay KHÔNG bọc children — children là sibling, bấm/select bình thường
    expect(overlay.contains(screen.getByRole('button', { name: 'Click' }))).toBe(false);
  });

  it('custom rotate/opacity/zIndex reflect: rotate vào SVG transform, opacity/z-index vào style', () => {
    const { container } = render(
      <Watermark content="x" rotate={-45} opacity={0.5} zIndex={42}>
        <div>doc</div>
      </Watermark>,
    );
    const overlay = overlayOf(container);
    expect(overlay.style.opacity).toBe('0.5');
    expect(overlay.style.zIndex).toBe('42');
    expect(decodeURIComponent(tileUrlOf(container))).toContain('rotate(-45');
  });

  it('left/top/width/height → overlay neo góc riêng (không inset-0)', () => {
    const { container } = render(
      <Watermark content="x" left={20} top="10px" width={200} height={100}>
        <div>doc</div>
      </Watermark>,
    );
    const overlay = overlayOf(container);
    expect(overlay.style.left).toBe('20px');
    expect(overlay.style.top).toBe('10px');
    expect(overlay.style.width).toBe('200px');
    expect(overlay.style.height).toBe('100px');
    expect(overlay.className).not.toContain('inset-0');
  });

  it('multi-line content (mảng) → cả 2 dòng trong tile; fontColor override vào fill', () => {
    const { container } = render(
      <Watermark content={['Line A', 'Line B']} fontColor="#123456">
        <div>doc</div>
      </Watermark>,
    );
    const svg = decodeURIComponent(tileUrlOf(container));
    expect(svg).toContain('Line A');
    expect(svg).toContain('Line B');
    expect(svg).toContain('fill="#123456"');
  });

  it('đổi content runtime qua state → tile re-bake (useMemo deps chạy đúng)', () => {
    function Demo() {
      const [c, setC] = useState('A');
      return (
        <Watermark content={c}>
          <button onClick={() => setC('B')}>Flip</button>
        </Watermark>
      );
    }
    const { container } = render(<Demo />);
    const before = tileUrlOf(container);
    fireEvent.click(screen.getByRole('button', { name: 'Flip' }));
    expect(tileUrlOf(container)).not.toBe(before);
    expect(decodeURIComponent(tileUrlOf(container))).toContain('>B<');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Watermark — classNames + style', () => {
  it('slots lên đúng element: root/overlay; className sau root slot (tile vẫn bake)', () => {
    const { container } = render(
      <Watermark
        content="SLOT"
        classNames={{ root: 'slot-root', overlay: 'slot-overlay' }}
        className="user-last"
      >
        <div>doc</div>
      </Watermark>,
    );
    const root = screen.getByText('doc').parentElement!;
    expect(root).toHaveClass('slot-root');
    expect(root.className.indexOf('slot-root')).toBeLessThan(root.className.indexOf('user-last'));
    expect(overlayOf(container)).toHaveClass('slot-overlay');
    expect(tileUrlOf(container)).toContain('SLOT'); // tile bake bình thường
  });

  it('style passthrough lên container (không đụng overlay style của kit)', () => {
    const { container } = render(
      <Watermark content="x" style={{ margin: '8px' }}>
        <div>doc</div>
      </Watermark>,
    );
    expect(screen.getByText('doc').parentElement).toHaveStyle({ margin: '8px' });
    expect(overlayOf(container).style.margin).toBe('');
  });
});
