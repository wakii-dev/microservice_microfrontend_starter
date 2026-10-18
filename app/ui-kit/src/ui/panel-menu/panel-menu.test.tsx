import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { PanelMenu } from './index.js';
afterEach(cleanup);
describe('PanelMenu', () => {
  it('accordion open/close', async () => {
    const user = userEvent.setup();
    render(<PanelMenu items={[{ key: 's', label: 'Settings', children: [{ key: 'g', label: 'General' }] }]} />);
    await user.click(screen.getByText('Settings'));
    expect(screen.getByText('General')).toBeInTheDocument();
  });
});

describe('PanelMenu — expand/collapse + selection', () => {
  const items = [
    {
      key: 'group',
      label: 'Manage',
      children: [
        { key: 'tasks', label: 'Tasks' },
        { key: 'users', label: 'Users' },
      ],
    },
  ];

  it('click group → children hiện; click lần nữa → ẩn', async () => {
    const user = userEvent.setup();
    render(<PanelMenu items={items} />);
    expect(screen.queryByText('Tasks')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Manage/ }));
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Manage/ }));
    expect(screen.queryByText('Tasks')).toBeNull();
  });

  it('leaf onClick (không children) → callback', async () => {
    const onLeaf = vi.fn();
    const user = userEvent.setup();
    render(<PanelMenu items={[{ key: 'home', label: 'Home', onClick: onLeaf }]} />);
    await user.click(screen.getByRole('button', { name: 'Home' }));
    expect(onLeaf).toHaveBeenCalledTimes(1);
  });
});

describe('PanelMenu — multiple open (Set state)', () => {
  it('mở 2 group → cả hai cùng mở (không single-open accordion)', async () => {
    const user = userEvent.setup();
    render(
      <PanelMenu
        items={[
          { key: 'a', label: 'Group A', children: [{ key: 'a1', label: 'A1' }] },
          { key: 'b', label: 'Group B', children: [{ key: 'b1', label: 'B1' }] },
        ]}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Group A/ }));
    await user.click(screen.getByRole('button', { name: /Group B/ }));
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
  });
});
