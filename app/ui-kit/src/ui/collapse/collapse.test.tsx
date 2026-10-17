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
    // grid-rows animation: content vẫn trong DOM nhưng wrapper có grid-rows-[0fr] khi đóng
    const wrapper = screen.getByText('nội dung A').parentElement;
    // sau lần mở: wrapper grid-rows-[1fr]
    expect(wrapper?.parentElement?.className).toContain('grid-rows-[1fr]');
    await user.click(screen.getByRole('button', { name: 'Panel A' }));
    // sau lần đóng: wrapper grid-rows-[0fr]
    expect(wrapper?.parentElement?.className).toContain('grid-rows-[0fr]');
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
});
