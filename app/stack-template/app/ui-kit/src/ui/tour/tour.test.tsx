// Tour tests — panel render + điều hướng prev/next/finish + ESC/mask đóng +
// spotlight đo theo getBoundingClientRect + focus trap (pattern Modal tests).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { Tour } from './index.js';

afterEach(cleanup);

const STEPS = [
  { title: 'Welcome', description: 'Intro step, no target' },
  { title: 'Profile', description: 'Your profile lives here', target: '#demo-card' },
  { title: 'Done', description: 'Last step' },
];

describe('Tour', () => {
  it('open + step không target → panel căn giữa, render title/description + counter', () => {
    render(<Tour steps={STEPS} open onClose={() => {}} />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Intro step, no target')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('closed → không render gì', () => {
    render(<Tour steps={STEPS} open={false} onClose={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[data-testid="tour-overlay"]')).toBeNull();
  });

  it('uncontrolled: Prev disabled bước đầu; Next đổi step; bước cuối → Finish', async () => {
    const user = userEvent.setup();
    render(<Tour steps={STEPS} open onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Prev' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Your profile lives here')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Prev' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
  });

  it('Finish ở bước cuối → onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Tour steps={STEPS} open current={2} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ESC → onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Tour steps={STEPS} open onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('click mask → onClose; click panel không đóng', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Tour steps={STEPS} open onClose={onClose} />);
    await user.click(screen.getByTestId('tour-spotlight'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1); // vẫn 1 — panel stopPropagation
  });

  it('controlled: current + onCurrentChange — Next báo index kế (không tự internal)', async () => {
    const user = userEvent.setup();
    const onCurrentChange = vi.fn();
    render(<Tour steps={STEPS} open current={0} onCurrentChange={onCurrentChange} onClose={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onCurrentChange).toHaveBeenCalledWith(1);
    expect(screen.getByText('1 / 3')).toBeInTheDocument(); // controlled — không tự nhảy
  });

  it('target selector → spotlight khoét lỗ theo rect + padding (8px)', () => {
    const spy = vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 100, left: 100, width: 200, height: 80, x: 100, y: 100, right: 300, bottom: 180, toJSON: () => ({}) } as DOMRect);
    try {
      render(
        <div id="demo-card" style={{ position: 'absolute', top: 100, left: 100, width: 200, height: 80 }} />,
      );
      render(<Tour steps={STEPS} open current={1} onClose={() => {}} />);
      const path = document.querySelector('[data-testid="tour-spotlight"] path');
      expect(path).not.toBeNull();
      // lỗ = rect + pad 8 → góc bo bắt đầu (92+8, 92) = (100, 92); w/h rời ràng = 200/80
      expect(path?.getAttribute('d')).toContain('M100 92 h200');
      expect(path?.getAttribute('d')).toContain('v80'); // h = 80 + 16 − 2×r(8)
      expect(path?.getAttribute('fill')).toBe('var(--mask)');
    } finally {
      spy.mockRestore();
    }
  });

  it('focus trap: mở → focus panel, Tab vòng trong, ESC đóng trả focus về trigger', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Start tour</button>
          <Tour steps={STEPS} open={open} onClose={() => setOpen(false)} />
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Start tour' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    // panel có focusable (×, Prev, Next) → trap focus phần tử đầu tiên TRONG panel
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement); // không thoát khỏi panel
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('fireEvent click overlay (không qua panel) → onClose', () => {
    const onClose = vi.fn();
    render(<Tour steps={STEPS} open onClose={onClose} />);
    fireEvent.click(screen.getByTestId('tour-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
