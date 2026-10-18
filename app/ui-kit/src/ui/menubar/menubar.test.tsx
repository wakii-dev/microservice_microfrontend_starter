import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Menubar } from './index.js';
afterEach(cleanup);
describe('Menubar', () => {
  it('items + hover dropdown children', async () => {
    const user = userEvent.setup();
    render(<Menubar items={[{ key: 'f', label: 'File', children: [{ key: 'open', label: 'Mở' }] }]} />);
    await user.hover(screen.getByText('File'));
    expect(screen.getByText('Mở')).toBeInTheDocument();
  });
});

describe('Menubar — hover dropdown', () => {
  it('mouseEnter item có children → submenu hiện; child click gọi onClick', async () => {
    const onChild = vi.fn();
    const user = userEvent.setup();
    render(
      <Menubar
        items={[
          {
            key: 'file',
            label: 'File',
            children: [{ key: 'new', label: 'New task', onClick: onChild }],
          },
        ]}
      />,
    );
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'File' }));
    expect(screen.getByText('New task')).toBeInTheDocument();
    await user.click(screen.getByText('New task'));
    expect(onChild).toHaveBeenCalledTimes(1);
    // mouseLeave → dropdown đóng
    fireEvent.mouseLeave(screen.getByRole('button', { name: 'File' }));
    expect(screen.queryByText('New task')).toBeNull();
  });

  it('item lá (không children) → onClick trực tiếp', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Menubar items={[{ key: 'help', label: 'Help', onClick }]} />);
    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
