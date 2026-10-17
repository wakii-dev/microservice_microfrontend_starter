import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContextMenu } from './index.js';
afterEach(cleanup);
const ITEMS = [{ key: 'edit', label: 'Sửa' }, { key: 'del', label: 'Xoá', danger: true }];
describe('ContextMenu', () => {
  it('right-click → menu; item click → callback; ESC đóng', async () => {
    const onItemClick = vi.fn();
    const user = userEvent.setup();
    render(<ContextMenu items={ITEMS} onItemClick={onItemClick}><div>T</div></ContextMenu>);
    fireEvent.contextMenu(screen.getByText('T'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByText('Sửa'));
    expect(onItemClick).toHaveBeenCalledWith('edit');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
