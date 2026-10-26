// Fieldset tests — legend + children, toggleable gập/mở (grid-rows 0fr), controlled,
// defaultCollapsed, non-toggleable không có nút.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Fieldset } from './index.js';

afterEach(cleanup);

describe('Fieldset', () => {
  it('render legend + children', () => {
    render(
      <Fieldset legend="Thông tin">
        <p>Nội dung bên trong</p>
      </Fieldset>,
    );
    expect(screen.getByText('Thông tin')).toBeInTheDocument();
    expect(screen.getByText('Nội dung bên trong')).toBeInTheDocument();
  });

  it('toggleable: click legend → gập (grid-template-rows 0fr + aria-expanded=false); click nữa → mở; onToggle báo', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <Fieldset legend="Thông tin" toggleable onToggle={onToggle}>
        <p>Nội dung</p>
      </Fieldset>,
    );
    const header = screen.getByRole('button', { name: /Thông tin/ });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    await user.click(header);
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header).toHaveAttribute('aria-controls');
    const clip = document.getElementById(header.getAttribute('aria-controls')!)!;
    expect(clip.style.gridTemplateRows).toBe('0fr');
    await user.click(header);
    expect(onToggle).toHaveBeenLastCalledWith(false);
    expect(clip.style.gridTemplateRows).toBe('1fr');
  });

  it('controlled collapsed=true → gập sẵn, click vẫn onToggle (consumer giữ state)', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <Fieldset legend="Cài đặt" toggleable collapsed onToggle={onToggle}>
        <p>Ẩn</p>
      </Fieldset>,
    );
    const header = screen.getByRole('button', { name: /Cài đặt/ });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    await user.click(header);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('defaultCollapsed → gập sẵn (uncontrolled), click mở', async () => {
    const user = userEvent.setup();
    render(
      <Fieldset legend="Tuỳ chọn" toggleable defaultCollapsed>
        <p>Bị gập ban đầu</p>
      </Fieldset>,
    );
    const header = screen.getByRole('button', { name: /Tuỳ chọn/ });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    await user.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('không toggleable → legend không phải nút, không aria-expanded', () => {
    render(<Fieldset legend="Chỉ đọc">nội dung</Fieldset>);
    expect(screen.queryByRole('button', { name: /Chỉ đọc/ })).toBeNull();
  });

  it('Enter/Space trên legend toggleable → gập/mở (a11y keyboard)', async () => {
    const user = userEvent.setup();
    render(
      <Fieldset legend="Bàn phím" toggleable>
        <p>nội dung</p>
      </Fieldset>,
    );
    const header = screen.getByRole('button', { name: /Bàn phím/ });
    header.focus();
    await user.keyboard('{Enter}');
    expect(header).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Fieldset — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root (fieldset) / legend / content', () => {
    render(
      <Fieldset
        legend="Thông tin"
        toggleable
        classNames={{ root: 'slot-root', legend: 'slot-legend', content: 'slot-content' }}
      >
        <p>Nội dung bên trong</p>
      </Fieldset>,
    );
    const root = screen.getByText('Nội dung bên trong').closest('fieldset')!;
    expect(root).toHaveClass('slot-root');
    expect(screen.getByRole('button', { name: /Thông tin/ })).toHaveClass('slot-legend');
    expect(screen.getByText('Nội dung bên trong').parentElement).toHaveClass('slot-content');
  });

  it('style passthrough lên root + không truyền slots → toggle vẫn onToggle (behavior giữ nguyên)', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <Fieldset legend="Cài đặt" toggleable onToggle={onToggle} style={{ margin: '8px' }} className="user-last">
        <p>Nội dung</p>
      </Fieldset>,
    );
    const root = screen.getByText('Nội dung').closest('fieldset') as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThan(root.className.indexOf('relative'));
    await user.click(screen.getByRole('button', { name: /Cài đặt/ }));
    expect(onToggle).toHaveBeenLastCalledWith(true);
  });
});
