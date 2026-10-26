// Menu tests — hành vi thật: render đa cấp, toggle submenu (aria-expanded +
// animate class), select lá (onSelect + aria-current + accent), disabled không
// fire, auto-open nhánh chứa selectedKey, horizontal khác vertical.
// Ghi chú: children submenu luôn ở trong DOM (collapse bằng grid-rows 0fr +
// opacity-0 để animate) — "hiện/ẩn" assert qua aria-expanded + class animate.
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Menu, MenuCompactContext, findPath, type MenuItemData } from './index.js';
import { Icon } from '../icons/index.js';

afterEach(cleanup);

// ul role=menu lồng luôn trong DOM (animate grid-rows) — root luôn là match đầu theo document order.
const rootMenu = () => screen.getAllByRole('menu')[0];

const threeLevels: MenuItemData[] = [
  { key: 'dash', label: 'Dashboard' },
  {
    key: 'ql',
    label: 'Quản lý',
    children: [
      {
        key: 'ql-tk',
        label: 'Tài khoản',
        children: [
          { key: 'ql-tk-ds', label: 'Danh sách' },
          { key: 'ql-tk-vt', label: 'Vai trò' },
        ],
      },
      { key: 'ql-cv', label: 'Công việc' },
    ],
  },
  { key: 'settings', label: 'Cài đặt', disabled: true },
];

describe('Menu — render', () => {
  it('render đa cấp — label mọi cấp present, role menu/menuitem', () => {
    render(<Menu items={threeLevels} />);
    expect(screen.getAllByRole('menu')[0]).toBeInTheDocument(); // [0] = root (nested ul role=menu luôn trong DOM để animate)
    expect(screen.getByRole('menuitem', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Danh sách' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Vai trò' })).toBeInTheDocument();
  });

  it('selectedKey → aria-current=true + accent đặc trắng chữ', () => {
    render(<Menu items={threeLevels} selectedKey="dash" />);
    const active = screen.getByRole('menuitem', { name: 'Dashboard' });
    expect(active).toHaveAttribute('aria-current', 'true');
    expect(active).toHaveClass('bg-accent', 'text-white', 'font-medium');
  });
});

describe('Menu — submenu', () => {
  it('click submenu → aria-expanded true + animate class mở', () => {
    render(<Menu items={threeLevels} />);
    const trigger = screen.getByRole('menuitem', { name: 'Quản lý' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // assert wrapper qua con TRỰC TIẾP 'Công việc' (Danh sách nằm dưới Tài khoản — cấp riêng)
    const wrapperOf = (name: string) =>
      screen.getByRole('menuitem', { name }).closest('ul')!.parentElement!.parentElement!;
    expect(wrapperOf('Công việc').className).toContain('[grid-template-rows:0fr]');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    // wrapper animate chuyển 0fr→1fr qua class grid-template-rows
    expect(wrapperOf('Công việc').className).toContain('[grid-template-rows:1fr]');
    expect(wrapperOf('Công việc').className).toContain('opacity-100');
  });

  it('click lần nữa → collapse (aria-expanded false + class 0fr)', () => {
    render(<Menu items={threeLevels} />);
    const trigger = screen.getByRole('menuitem', { name: 'Quản lý' });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const nested = screen.getByRole('menuitem', { name: 'Công việc' }).closest('ul')!.parentElement!.parentElement!;
    expect(nested.className).toContain('[grid-template-rows:0fr]');
    expect(nested.className).toContain('opacity-0');
  });

  it('auto-open lần đầu — nhánh chứa selectedKey mở sẵn cả 2 cấp', () => {
    render(<Menu items={threeLevels} selectedKey="ql-tk-ds" />);
    expect(screen.getByRole('menuitem', { name: 'Quản lý' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Tài khoản' })).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Menu — select & disabled', () => {
  it('click item lá → onSelect(key)', () => {
    const onSelect = vi.fn();
    render(<Menu items={threeLevels} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Công việc' }));
    expect(onSelect).toHaveBeenCalledWith('ql-cv');
  });

  it('click lá sau khi mở submenu cha', () => {
    const onSelect = vi.fn();
    render(<Menu items={threeLevels} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tài khoản' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Danh sách' }));
    expect(onSelect).toHaveBeenCalledWith('ql-tk-ds');
  });

  it('disabled → attr disabled, click không fire', () => {
    const onSelect = vi.fn();
    render(<Menu items={threeLevels} onSelect={onSelect} />);
    const btn = screen.getByRole('menuitem', { name: 'Cài đặt' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveClass('text-ink4', 'cursor-not-allowed');
    expect(btn).not.toHaveClass('hover:bg-s3');
    fireEvent.click(btn);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('selected item không mất active khi hover (hover:bg-accent)', () => {
    render(<Menu items={threeLevels} selectedKey="dash" />);
    expect(screen.getByRole('menuitem', { name: 'Dashboard' })).toHaveClass('hover:bg-accent');
  });
});

describe('Menu — horizontal vs vertical', () => {
  it('horizontal: root flex-row; panel dropdown absolute dưới (top-full)', () => {
    render(<Menu items={threeLevels} mode="horizontal" />);
    expect(rootMenu()).toHaveClass('flex items-center gap-1');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Quản lý' }));
    const panel = screen.getByRole('menuitem', { name: 'Công việc' }).closest('ul')!;
    expect(panel).toHaveClass('absolute', 'top-full', 'left-0');
    expect(panel).toHaveClass('shadow-[var(--shadow-pop)]');
  });

  it('horizontal cấp 2 → flyout bên phải (left-full top-0)', () => {
    render(<Menu items={threeLevels} mode="horizontal" />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Quản lý' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tài khoản' }));
    const flyout = screen.getByRole('menuitem', { name: 'Danh sách' }).closest('ul')!;
    expect(flyout).toHaveClass('left-full', 'top-0');
  });

  it('horizontal chọn lá → đóng toàn bộ panel (unmount)', () => {
    const onSelect = vi.fn();
    render(<Menu items={threeLevels} mode="horizontal" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Quản lý' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Công việc' }));
    expect(onSelect).toHaveBeenCalledWith('ql-cv');
    // horizontal panel đóng = unmount (không giữ DOM như vertical animate)
    expect(screen.queryByRole('menuitem', { name: 'Tài khoản' })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: 'Công việc' })).toBeNull();
  });

  it('vertical: root flex-col; submenu inline (không absolute)', () => {
    render(<Menu items={threeLevels} />);
    expect(rootMenu()).toHaveClass('flex flex-col gap-1');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Quản lý' }));
    const nested = screen.getByRole('menuitem', { name: 'Công việc' }).closest('ul')!;
    expect(nested).toHaveClass('ml-4');
    expect(nested).not.toHaveClass('absolute');
  });
});

describe('findPath', () => {
  it('trả trail các cha (không gồm leaf)', () => {
    expect(findPath(threeLevels, 'ql-tk-ds')).toEqual(['ql', 'ql-tk']);
  });
  it('không có selected → null; leaf cấp 1 → []', () => {
    expect(findPath(threeLevels, undefined)).toBeNull();
    expect(findPath(threeLevels, 'dash')).toEqual([]);
  });
});

describe('Menu — compact (sidebar icon-only, fix ⑥ 2026-10-18)', () => {
  it('item = ô vuông size-8 căn giữa cột (mx-auto) — kiểu antd sider thu gọn', () => {
    render(
      <MenuCompactContext.Provider value={true}>
        <Menu items={threeLevels} />
      </MenuCompactContext.Provider>,
    );
    const item = screen.getByRole('menuitem', { name: 'Dashboard' });
    expect(item).toHaveClass('size-8', 'justify-center', 'px-0');
    expect(item).toHaveClass('hover:bg-s3');
    expect(item).not.toHaveClass('w-full');
  });

  it('submenu cha compact → chấm chỉ báo con (dot) + không chevron', () => {
    // dot gắn trên ICON cha — fixture có icon (như AdminLayout dùng Icon users)
    const withIcon: MenuItemData[] = [
      {
        key: 'ql',
        label: 'Quản lý',
        icon: <Icon name="users" size={16} />,
        children: [{ key: 'a', label: 'Con' }],
      },
    ];
    render(
      <MenuCompactContext.Provider value={true}>
        <Menu items={withIcon} />
      </MenuCompactContext.Provider>,
    );
    const trigger = screen.getByRole('menuitem', { name: 'Quản lý' });
    const dot = trigger.querySelector('span.relative > span');
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass('size-1', 'rounded-full', 'bg-ink3');
    expect(trigger.querySelector('svg')).not.toBeNull(); // svg duy nhất = icon users
    expect(trigger.querySelectorAll('svg')).toHaveLength(1); // chevron đã ẩn khi compact
  });


  it('compact: con ẨN mặc định trong collapse — bấm cha mở ra, icon thẳng cột cha (không indent)', () => {
    render(
      <MenuCompactContext.Provider value={true}>
        <Menu items={threeLevels} />
      </MenuCompactContext.Provider>,
    );
    const trigger = screen.getByRole('menuitem', { name: 'Quản lý' });
    const wrapperOf = (name: string) =>
      screen.getByRole('menuitem', { name }).closest('ul')!.parentElement!.parentElement!;
    // mặc định con ẪN (wrapper 0fr) — nằm trong collapse như mode thường
    expect(wrapperOf('Công việc').className).toContain('[grid-template-rows:0fr]');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(wrapperOf('Công việc').className).toContain('[grid-template-rows:1fr]');
    // mở ra: icon con thẳng CỘT cha — nested ul items-center, KHÔNG ml-4
    const nested = screen.getByRole('menuitem', { name: 'Công việc' }).closest('ul')!;
    expect(nested).toHaveClass('items-center');
    expect(nested).not.toHaveClass('ml-4');
    expect(screen.getByRole('menuitem', { name: 'Công việc' })).toHaveClass('size-8');
    // item con không có icon → chữ cái đầu đại diện (ô vuông không trống)
    expect(screen.getByRole('menuitem', { name: 'Công việc' }).textContent).toContain('C');
  });

  it('compact: parent CÓ aria-expanded (con ẩn mặc định — bấm cha mở)', () => {
    render(
      <MenuCompactContext.Provider value={true}>
        <Menu items={threeLevels} />
      </MenuCompactContext.Provider>,
    );
    const trigger = screen.getByRole('menuitem', { name: 'Quản lý' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('expanded giữ layout cũ: px-3 gap-2, không dot', () => {
    render(<Menu items={threeLevels} />);
    const item = screen.getByRole('menuitem', { name: 'Dashboard' });
    expect(item).toHaveClass('px-3', 'py-1.5', 'gap-2');
    expect(item).not.toHaveClass('justify-center');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Menu — classNames slots + style', () => {
  const TREE: MenuItemData[] = [
    { key: 'home', label: 'Home' },
    { key: 'mng', label: 'Manage', children: [{ key: 'tasks', label: 'Tasks' }] },
  ];

  it('slots lên đúng element: root/list/item/itemButton (kể cả submenu)', () => {
    render(
      <Menu
        items={TREE}
        selectedKey="tasks"
        classNames={{ root: 'slot-root', list: 'slot-list', item: 'slot-item', itemButton: 'slot-btn' }}
      />,
    );
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    // root ul + submenu ul đều nhận slot list (submenu luôn trong DOM, collapse bằng grid-rows)
    expect(document.querySelectorAll('ul.slot-list').length).toBe(2);
    expect(screen.getByRole('menuitem', { name: 'Home' })).toHaveClass('slot-btn');
    expect(screen.getByText('Home').closest('li')).toHaveClass('slot-item');
  });

  it('style passthrough lên nav; className người dùng sau root slot', () => {
    render(<Menu items={TREE} style={{ padding: '8px' }} classNames={{ root: 'slot-root' }} className="user-last" />);
    const nav = document.querySelector('nav.slot-root') as HTMLElement;
    expect(nav).toHaveStyle({ padding: '8px' });
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });
});
