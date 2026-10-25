// Popover tests — hover/click/focus trigger, ESC, click-outside (useClickAway),
// controlled open, placement class, a11y (aria-haspopup/expanded + role=dialog),
// rich content (title divider + ReactNode tương tác được).
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Popover } from './index.js';

afterEach(cleanup);

describe('Popover', () => {
  it('mặc định ẩn; hover mở (title + content), leave đóng', () => {
    render(
      <Popover title="Panel title" content="Panel body">
        <button>Trigger</button>
      </Popover>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Panel title')).toBeInTheDocument();
    expect(screen.getByText('Panel body')).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('trigger click — click mở, click lần nữa toggle đóng', async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger="click" title="T" content="C">
        <button>Trigger</button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('trigger focus — focus mở, blur đóng', () => {
    render(
      <Popover trigger="focus" title="T" content="C">
        <button>Trigger</button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.focus(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.blur(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ESC đóng panel khi đang mở', async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger="click" title="T" content="C">
        <button>Trigger</button>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mousedown ngoài root → đóng (useClickAway); click TRONG panel không đóng', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Popover trigger="click" title="T" content="C">
          <button>Trigger</button>
        </Popover>
        <button>Outside</button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('dialog')); // panel nằm trong root → giữ mở
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' })); // ngoài root → đóng
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('placement mặc định top (panel trên); bottom → panel dưới (class vị trí)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Popover trigger="click" title="T" content="C">
        <button>Trigger</button>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog').className).toContain('bottom-[calc(100%+10px)]');
    await user.keyboard('{Escape}');
    rerender(
      <Popover trigger="click" placement="bottom" title="T" content="C">
        <button>Trigger</button>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog').className).toContain('top-[calc(100%+10px)]');
  });

  it('a11y: trigger aria-haspopup=dialog + aria-expanded theo open; panel role=dialog', async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger="click" title="T" content="C">
        <button>Trigger</button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('controlled: click KHÔNG tự đóng — chỉ gọi onOpenChange cho consumer', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Popover open={true} onOpenChange={onOpenChange} trigger="click" title="T" content="C">
        <button>Trigger</button>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument(); // open prop vẫn true
  });

  it('controlled toggle qua consumer state: onOpenChange(false) → panel đóng', async () => {
    function Demo() {
      const [open, setOpen] = useState(true);
      return (
        <Popover open={open} onOpenChange={setOpen} trigger="click" title="T" content="C">
          <button>Trigger</button>
        </Popover>
      );
    }
    const user = userEvent.setup();
    render(<Demo />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('rich content: title có divider, content ReactNode tương tác được (button trong panel)', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(
      <Popover
        trigger="click"
        title="Members"
        content={
          <div>
            <p>Alice — admin</p>
            <button onClick={onAction}>Invite</button>
          </div>
        }
      >
        <button>Trigger</button>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByText('Members').className).toContain('border-b'); // divider title
    await user.click(screen.getByRole('button', { name: 'Invite' }));
    expect(onAction).toHaveBeenCalledTimes(1); // click trong panel không đóng + callback chạy
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Popover — customize (slots wave 3)', () => {
  it('classNames slots đúng element: root/trigger → 2 span bọc, panel → dialog', async () => {
    const user = userEvent.setup();
    render(
      <Popover
        trigger="click"
        title="T"
        content="C"
        classNames={{ root: 'my-root', trigger: 'my-trigger', panel: 'my-panel' }}
      >
        <button>Trigger</button>
      </Popover>,
    );
    const triggerWrap = screen.getByRole('button', { name: 'Trigger' }).parentElement as HTMLElement;
    const root = triggerWrap.parentElement as HTMLElement;
    expect(triggerWrap.className).toContain('my-trigger');
    expect(root.className).toContain('my-root');
    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('dialog').className).toContain('my-panel');
  });

  it('style passthrough lên span gốc (root)', () => {
    render(
      <Popover title="T" content="C" style={{ zIndex: 7 }}>
        <button>T</button>
      </Popover>,
    );
    const root = (screen.getByRole('button', { name: 'T' }).parentElement as HTMLElement).parentElement as HTMLElement;
    expect(root.style.zIndex).toBe('7');
  });
});
