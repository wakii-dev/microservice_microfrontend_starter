// Breadcrumb tests — items + separator + last plain + href link.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Breadcrumb } from './index.js';

afterEach(cleanup);

describe('Breadcrumb', () => {
  it('href → link; cuối → plain text không link; separator /', () => {
    render(
      <Breadcrumb
        items={[
          { title: 'Trang chủ', href: '/' },
          { title: 'Tasks', href: '/tasks' },
          { title: 'Task A' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Trang chủ' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Task A').tagName).toBe('SPAN');
    expect(screen.getAllByText('/').length).toBe(2);
  });
});

describe('Breadcrumb — branch phụ', () => {
  it('item giữa KHÔNG href → plain span (không link)', () => {
    render(
      <Breadcrumb
        items={[
          { title: 'A', href: '/a' },
          { title: 'B' },
          { title: 'C', href: '/c' },
          { title: 'D — hiện tại' },
        ]}
      />,
    );
    expect(screen.getByText('B').tagName).toBe('SPAN');
    expect(screen.getByRole('link', { name: 'C' })).toBeInTheDocument();
    expect(screen.getByText('D — hiện tại').tagName).toBe('SPAN');
  });
});

describe('Breadcrumb — branch phụ (Tier 5 sweep)', () => {
  it('separator aria-hidden giữa items', () => {
    render(<Breadcrumb items={[{ title: 'A' }, { title: 'B' }]} />);
    const sep = screen.getAllByText('/');
    sep.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Breadcrumb — classNames + style', () => {
  const ITEMS = [
    { title: 'Home', href: '/' },
    { title: 'Settings' },
  ];

  it('slots lên đúng element: root/list/item/link/label/separator', () => {
    render(
      <Breadcrumb
        items={ITEMS}
        classNames={{ root: 'slot-root', list: 'slot-list', item: 'slot-item', link: 'slot-link', label: 'slot-label', separator: 'slot-sep' }}
      />,
    );
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    expect(document.querySelector('ol.slot-list')).not.toBeNull();
    expect(screen.getByText('Home')).toHaveClass('slot-link');
    expect(screen.getByText('Settings')).toHaveClass('slot-label');
    expect(screen.getByText('/', { selector: 'span.slot-sep' })).toBeInTheDocument();
    expect(screen.getByText('Home').closest('li')).toHaveClass('slot-item');
  });

  it('style passthrough lên nav; className người dùng sau root slot', () => {
    render(<Breadcrumb items={ITEMS} style={{ padding: '2px' }} classNames={{ root: 'slot-root' }} className="user-last" />);
    const nav = document.querySelector('nav.slot-root') as HTMLElement;
    expect(nav).toHaveStyle({ padding: '2px' });
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });
});
