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

  it('click group → children hiện; click lần nữa → ẩn (grid 0fr + aria-hidden)', async () => {
    const user = userEvent.setup();
    render(<PanelMenu items={items} />);
    // luôn render (animation 0fr↔1fr): ban đầu bọc aria-hidden
    expect(screen.getByText('Tasks').closest('[aria-hidden="true"]')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: /Manage/ }));
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Tasks').closest('[aria-hidden="true"]')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Manage/ }));
    expect(screen.getByText('Tasks').closest('[aria-hidden="true"]')).not.toBeNull();
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

// ── slots-wave: classNames slots + style passthrough ──

describe('PanelMenu — classNames slots + style', () => {
  const ITEMS = [
    { key: 'g', label: 'Group', children: [{ key: 's1', label: 'Sub 1' }] },
    { key: 'leaf', label: 'Leaf' },
  ];

  it('slots lên đúng element: root/item/header/submenu/subList/subItem', async () => {
    const user = userEvent.setup();
    render(
      <PanelMenu
        items={ITEMS}
        classNames={{ root: 'slot-root', item: 'slot-item', header: 'slot-header', submenu: 'slot-sub', subList: 'slot-list', subItem: 'slot-sub-btn' }}
      />,
    );
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    expect(screen.getByText('Group')).toHaveClass('slot-header');
    expect(screen.getByText('Group').closest('div')).toHaveClass('slot-item');
    expect(screen.getByText('Leaf')).toHaveClass('slot-header');
    await user.click(screen.getByRole('button', { name: /Group/ }));
    expect(document.querySelector('div.slot-sub ul.slot-list')).not.toBeNull();
    expect(screen.getByText('Sub 1')).toHaveClass('slot-sub-btn');
  });

  it('style passthrough lên nav; className người dùng sau root slot', () => {
    render(<PanelMenu items={ITEMS} style={{ padding: '2px' }} classNames={{ root: 'slot-root' }} className="user-last" />);
    const nav = document.querySelector('nav.slot-root') as HTMLElement;
    expect(nav).toHaveStyle({ padding: '2px' });
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });
});
