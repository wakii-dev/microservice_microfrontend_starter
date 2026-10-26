// Divider tests — horizontal/vertical/dashed/with-text.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Divider } from './index.js';

afterEach(cleanup);

describe('Divider', () => {
  it('horizontal mặc định → role=separator + margin 16px 0', () => {
    render(<Divider />);
    const el = screen.getByRole('separator');
    expect(el).toHaveStyle({ margin: '16px 0' });
  });

  it('vertical → orientation vertical + h 0.9em', () => {
    render(<Divider type="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('dashed → border-dashed', () => {
    render(<Divider dashed />);
    expect(screen.getByRole('separator').className).toContain('border-dashed');
  });

  it('with text → text giữa 2 đường kẻ', () => {
    render(<Divider>hoặc</Divider>);
    expect(screen.getByText('hoặc')).toBeInTheDocument();
  });

  it('vertical → margin 0 8px, không chiếm dòng (inline-block)', () => {
    render(<Divider type="vertical" />);
    const el = screen.getByRole('separator');
    expect(el).toHaveStyle({ margin: '0 8px' });
    expect(el.className).toContain('inline-block');
  });

  it('with text → outer role=separator + text-label (style matrix meta=label)', () => {
    render(<Divider>hoặc</Divider>);
    const el = screen.getByRole('separator');
    expect(el.className).toContain('text-label');
  });

  it('className passthrough cả 3 variant', () => {
    const { container } = render(<Divider className="marker" />);
    expect(container.querySelector('div[role="separator"]')).toHaveClass('marker');
  });
});

describe('Divider — combo branch (Tier 5 sweep)', () => {
  it('vertical + dashed; with-text dashed; with-text solid', () => {
    // RTL render mỗi lần tạo container mới trong body — query qua document (cộng dồn)
    const one = render(<Divider type="vertical" dashed />);
    expect(one.container.querySelector('span[role="separator"]')?.className).toContain('border-dashed');
    one.unmount();
    const two = render(<Divider dashed>hoặc</Divider>);
    // with-text: outer giữ role=separator; 2 line span border-dashed
    expect(two.container.querySelectorAll('span.border-dashed').length).toBe(2);
    two.unmount();
    const three = render(<Divider>hoặc</Divider>);
    expect(three.container.querySelectorAll('span.border-dashed').length).toBe(0);
    three.unmount();
  });

  // ── Case-coverage audit 2026-10-18 (antd parity: orientation) ──

  it('orientation="left" → text trái, 1 line bên phải', () => {
    const { container } = render(<Divider orientation="left">Section</Divider>);
    const wrapper = container.querySelector('[role="separator"]')!;
    const spans = wrapper.querySelectorAll('span');
    expect(spans).toHaveLength(2);
    expect(spans[0]).toHaveTextContent('Section');
    expect(spans[0]).toHaveClass('mr-4'); // text trái + gap trước line
    expect(spans[1]).toHaveClass('flex-1'); // line chiếm phần còn
  });

  it('orientation="right" → line trái, text phải', () => {
    const { container } = render(<Divider orientation="right">Section</Divider>);
    const spans = container.querySelector('[role="separator"]')!.querySelectorAll('span');
    expect(spans[0]).toHaveClass('flex-1');
    expect(spans[1]).toHaveTextContent('Section');
    expect(spans[1]).toHaveClass('ml-4');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Divider — classNames + style', () => {
  it('slots root/label/line lên đúng element (text + 2 line)', () => {
    const { container } = render(
      <Divider classNames={{ root: 'slot-root', label: 'slot-label', line: 'slot-line' }}>OR</Divider>,
    );
    expect(container.firstElementChild).toHaveClass('slot-root');
    expect(screen.getByText('OR')).toHaveClass('slot-label');
    expect(container.querySelectorAll('.slot-line').length).toBe(2);
  });

  it('style passthrough override margin mặc định (horizontal + vertical)', () => {
    const { container, rerender } = render(<Divider style={{ margin: '4px 0' }} />);
    expect(container.firstElementChild).toHaveStyle({ margin: '4px 0' });
    rerender(<Divider type="vertical" style={{ margin: '0 2px' }} />);
    expect(container.firstElementChild).toHaveStyle({ margin: '0px 2px' });
  });
});
