// Collapse tests — mở/đóng panel, nhiều panel cùng lúc, defaultActiveKeys.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Collapse } from './index.js';

const ITEMS = [
  { key: 'a', label: 'Panel A', children: <p>nội dung A</p> },
  { key: 'b', label: 'Panel B', children: <p>nội dung B</p> },
];

afterEach(cleanup);

describe('Collapse', () => {
  it('mặc định đóng; click label → mở; click lần nữa → đóng', async () => {
    const user = userEvent.setup();
    render(<Collapse items={ITEMS} />);
    await user.click(screen.getByRole('button', { name: 'Panel A' }));
    // grid-rows animation: content vẫn trong DOM; grid 3 tầng — từ content lên 2 cấp là grid
    const wrapper = screen.getByText('nội dung A').parentElement; // tầng 3 (padding)
    // sau lần mở: grid tầng 1 có grid-rows-[1fr]
    expect(wrapper?.parentElement?.parentElement?.className).toContain('grid-rows-[1fr]');
    await user.click(screen.getByRole('button', { name: 'Panel A' }));
    // sau lần đóng: grid tầng 1 có grid-rows-[0fr]
    expect(wrapper?.parentElement?.parentElement?.className).toContain('grid-rows-[0fr]');
  });

  it('nhiều panel mở cùng lúc + defaultActiveKeys', () => {
    render(<Collapse items={ITEMS} defaultActiveKeys={['a', 'b']} />);
    expect(screen.getByText('nội dung A')).toBeInTheDocument();
    expect(screen.getByText('nội dung B')).toBeInTheDocument();
  });
});

describe('Collapse — branch phụ (Tier 5 sweep)', () => {
  it('chevron xoay theo open (aria-expanded)', async () => {
    const user = userEvent.setup();
    render(<Collapse items={ITEMS} />);
    const btn = screen.getByRole('button', { name: 'Panel A' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('keyboard: focus header → Enter mở (button native)', async () => {
    const user = userEvent.setup();
    render(<Collapse items={ITEMS} />);
    const btn = screen.getByRole('button', { name: 'Panel A' });
    btn.focus();
    await user.keyboard('{Enter}');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('mặc định tất cả đóng (grid-rows-[0fr]); defaultActiveKeys chỉ mở đúng panel', () => {
    const { container } = render(<Collapse items={ITEMS} defaultActiveKeys={['b']} />);
    const wrappers = container.querySelectorAll('.grid');
    expect(wrappers[0]).toHaveClass('grid-rows-[0fr]');
    expect(wrappers[1]).toHaveClass('grid-rows-[1fr]');
  });

  it('items rỗng → chỉ container, không panel', () => {
    const { container } = render(<Collapse items={[]} />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('label ReactNode + className passthrough', () => {
    const { container } = render(
      <Collapse
        className="marker"
        items={[{ key: 'a', label: <strong>Label đậm</strong>, children: 'nội dung' }]}
      />,
    );
    expect(container.firstElementChild).toHaveClass('marker');
    expect(screen.getByText('Label đậm').tagName).toBe('STRONG');
  });

  // ── Case-coverage audit 2026-10-18 (antd parity: accordion + disabled) ──

  it('accordion → mở panel mới tự đóng panel cũ (1 panel mở tại 1 thời điểm)', async () => {
    render(<Collapse accordion items={ITEMS} />);
    const headerA = screen.getByRole('button', { name: 'Panel A' });
    const headerB = screen.getByRole('button', { name: 'Panel B' });
    await userEvent.click(headerA);
    expect(headerA).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(headerB);
    // panel A thu về grid-rows 0fr (ẩn CSS — children vẫn trong DOM, collapse render-cả)
    expect(headerA).toHaveAttribute('aria-expanded', 'false');
    expect(headerB).toHaveAttribute('aria-expanded', 'true');
    expect(headerB.closest('div')!.querySelector('.grid-rows-\\[1fr\\]')).not.toBeNull();
    expect(headerA.closest('div')!.querySelector('.grid-rows-\\[0fr\\]')).not.toBeNull();
  });

  it('item disabled → header không bấm được, panel không mở', async () => {
    render(
      <Collapse
        items={[
          { key: 'a', label: 'Khoá', children: <p>bí mật</p>, disabled: true },
        ]}
      />,
    );
    const header = screen.getByRole('button', { name: 'Khoá' });
    expect(header).toBeDisabled();
    expect(header).toHaveClass('cursor-not-allowed');
    await userEvent.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    // panel không bao giờ mở — body vẫn grid-rows 0fr
    expect(header.closest('div')!.querySelector('.grid-rows-\\[1fr\\]')).toBeNull();
  });

  it('panel đóng → grid-rows-[0fr] + cấu trúc 3 tầng (clip sạch padding — fix lộ 12px)', () => {
    const { container } = render(
      <Collapse items={[{ key: 'a', label: 'Panel A', children: <p>nội dung</p> }]} />,
    );
    const grid = container.querySelector('.grid-rows-\\[0fr\\]')!;
    expect(grid).toBeInTheDocument();
    // tầng 2: element clip — min-h-0 overflow-hidden, KHÔNG mang padding
    const clip = grid.firstElementChild!;
    expect(clip).toHaveClass('overflow-hidden', 'min-h-0');
    expect(clip.className).not.toContain('px-4');
    expect(clip.className).not.toContain('pb-3');
    // tầng 3: padding + typography là CON của element được clip (mới bị clip đúng)
    const content = clip.firstElementChild!;
    expect(content).toHaveClass('px-4', 'pb-3', 'text-body', 'text-ink2');
    expect(content).toHaveTextContent('nội dung');
  });
});
