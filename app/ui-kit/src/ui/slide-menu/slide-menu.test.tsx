// SlideMenu tests — slide giữa cấp qua transform translateX (assert style),
// back button + ESC pop cấp, leaf onClick, inert trang không hiện tại.
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SlideMenu, type SlideMenuItem } from './index.js';

afterEach(cleanup);

const ITEMS: SlideMenuItem[] = [
  {
    key: 'projects',
    label: 'Dự án',
    children: [
      {
        key: 'active',
        label: 'Đang chạy',
        children: [{ key: 'vu53', label: 'VU-53 redesign' }],
      },
      { key: 'archived', label: 'Đã lưu trữ' },
    ],
  },
  { key: 'settings', label: 'Cài đặt', onClick: vi.fn() },
];

function track() {
  return document.querySelector('[data-slide-track]') as HTMLElement;
}

describe('SlideMenu — trượt cấp', () => {
  it('render root role=menu/menuitem; chưa trượt (transform 0)', () => {
    render(<SlideMenu items={ITEMS} ariaLabel="Menu chính" />);
    expect(screen.getByRole('navigation', { name: 'Menu chính' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Dự án' })).toBeInTheDocument();
    expect(track().style.transform).toBe('translateX(-0%)');
    expect(screen.queryByText('Đang chạy')).toBeNull();
  });

  it('click item có children → translateX(-100%) + cấp con hiện + chevron + aria-haspopup', async () => {
    const user = userEvent.setup();
    render(<SlideMenu items={ITEMS} />);
    const trigger = screen.getByRole('menuitem', { name: 'Dự án' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await user.click(trigger);
    expect(track().style.transform).toBe('translateX(-100%)');
    expect(screen.getByRole('menuitem', { name: 'Đang chạy' })).toBeInTheDocument();
    // trang gốc inert + aria-hidden — không phá tab order
    const rootPage = track().children[0] as HTMLElement;
    expect(rootPage).toHaveAttribute('aria-hidden', 'true');
    expect(rootPage).toHaveAttribute('inert');
  });

  it('back button (chevron-left + nhãn cấp cha) → về cấp trước, back biến mất', async () => {
    const user = userEvent.setup();
    render(<SlideMenu items={ITEMS} />);
    await user.click(screen.getByRole('menuitem', { name: 'Dự án' }));
    const back = screen.getByRole('button', { name: 'Dự án' }); // trang gốc đang aria-hidden → chỉ còn back khớp
    expect(back).toHaveAttribute('data-slide-back');
    await user.click(back);
    expect(track().style.transform).toBe('translateX(-0%)');
    expect(document.querySelector('[data-slide-back]')).toBeNull();
    // trigger gốc quay lại a11y tree (role=menuitem)
    expect(screen.getByRole('menuitem', { name: 'Dự án' })).toBeInTheDocument();
  });

  it('ESC → pop 1 cấp', async () => {
    const user = userEvent.setup();
    render(<SlideMenu items={ITEMS} />);
    await user.click(screen.getByRole('menuitem', { name: 'Dự án' }));
    fireEvent.keyDown(screen.getByRole('navigation'), { key: 'Escape' });
    expect(track().style.transform).toBe('translateX(-0%)');
  });

  it('lồng 2 cấp: translateX(-200%), back label đúng từng cấp, leaf cấp sâu onClick', async () => {
    const onLeaf = vi.fn();
    const user = userEvent.setup();
    render(
      <SlideMenu
        items={[
          {
            key: 'a',
            label: 'Quản trị',
            children: [
              {
                key: 'a1',
                label: 'Người dùng',
                children: [{ key: 'a1a', label: 'Phân quyền', onClick: onLeaf }],
              },
            ],
          },
        ]}
      />,
    );
    await user.click(screen.getByRole('menuitem', { name: 'Quản trị' }));
    await user.click(screen.getByRole('menuitem', { name: 'Người dùng' }));
    expect(track().style.transform).toBe('translateX(-200%)');
    // back của trang sâu nhất = nhãn cấp cha trực tiếp (back cuối trong track)
    const backs = document.querySelectorAll('[data-slide-back]');
    expect(backs).toHaveLength(2);
    expect(backs[backs.length - 1].textContent).toContain('Người dùng');
    await user.click(screen.getByRole('menuitem', { name: 'Phân quyền' }));
    expect(onLeaf).toHaveBeenCalledTimes(1);
  });

  it('leaf gốc → onClick trực tiếp; danger → text-st-fail', async () => {
    const onSettings = vi.fn();
    const user = userEvent.setup();
    render(
      <SlideMenu
        items={[
          { key: 's', label: 'Cài đặt', onClick: onSettings },
          { key: 'd', label: 'Xoá tài khoản', danger: true },
        ]}
      />,
    );
    await user.click(screen.getByRole('menuitem', { name: 'Cài đặt' }));
    expect(onSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menuitem', { name: 'Xoá tài khoản' }).className).toContain('text-st-fail');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('SlideMenu — classNames slots + style', () => {
  const ITEMS: SlideMenuItem[] = [
    { key: 'a', label: 'Alpha', children: [{ key: 'a1', label: 'Alpha 1' }] },
  ];

  it('slots lên đúng element: root/track/page/back/item/itemButton', () => {
    render(
      <SlideMenu
        items={ITEMS}
        classNames={{ root: 'slot-root', track: 'slot-track', page: 'slot-page', back: 'slot-back', item: 'slot-item', itemButton: 'slot-btn' }}
      />,
    );
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    expect(document.querySelector('[data-slide-track]')).toHaveClass('slot-track');
    expect(screen.getAllByRole('menuitem', { name: 'Alpha' })[0].closest('li')).toHaveClass('slot-item');
    expect(screen.getAllByRole('menuitem', { name: 'Alpha' })[0]).toHaveClass('slot-btn');
    fireEvent.click(screen.getAllByRole('menuitem', { name: 'Alpha' })[0]);
    expect(screen.getByRole('menuitem', { name: 'Alpha 1' })).toHaveClass('slot-btn');
    const back = document.querySelector('[data-slide-back]');
    expect(back).toHaveClass('slot-back');
    expect(back!.textContent).toContain('Alpha');
  });

  it('style passthrough lên nav; className người dùng sau root slot', () => {
    render(
      <SlideMenu items={ITEMS} style={{ padding: '2px' }} classNames={{ root: 'slot-root' }} className="user-last" />,
    );
    const nav = document.querySelector('nav.slot-root') as HTMLElement;
    expect(nav).toHaveStyle({ padding: '2px' });
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });
});
