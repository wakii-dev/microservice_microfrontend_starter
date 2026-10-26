import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TabMenu } from './index.js';
afterEach(cleanup);
describe('TabMenu', () => {
  it('activeKey + click onChange + href link', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(<TabMenu activeKey="b" onTabChange={onTabChange}
      model={[{ key: 'a', label: 'Home', href: '/' }, { key: 'b', label: 'Tasks' }]} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tasks' }));
    expect(onTabChange).toHaveBeenCalledWith('b');
  });
});

describe('TabMenu — controlled + links', () => {
  it('onTabChange bắn key khi bấm tab khác', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TabMenu
        model={[
          { key: 'all', label: 'All' },
          { key: 'doing', label: 'In progress' },
        ]}
        activeKey="all"
        onTabChange={onTabChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'In progress' }));
    expect(onTabChange).toHaveBeenCalledWith('doing');
  });

  it('href item → render <a> (không button)', () => {
    render(
      <TabMenu
        model={[
          { key: 'docs', label: 'Docs', href: '#' },
          { key: 'api', label: 'API', href: '#' },
        ]}
        activeKey="api"
      />,
    );
    const link = screen.getByRole('link', { name: 'API' });
    expect(link).toHaveAttribute('href', '#');
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('TabMenu — classNames + style', () => {
  const MODEL = [
    { key: 'a', label: 'Alpha' },
    { key: 'b', label: 'Beta', href: '#beta' },
  ];

  it('slot item lên cả <button> và <a>; root lên nav; className sau root slot', () => {
    render(
      <TabMenu
        model={MODEL}
        activeKey="a"
        classNames={{ root: 'slot-root', item: 'slot-item' }}
        className="user-last"
      />,
    );
    expect(document.querySelector('nav.slot-root')).not.toBeNull();
    expect(screen.getByText('Alpha')).toHaveClass('slot-item');
    expect(screen.getByText('Beta')).toHaveClass('slot-item');
    const nav = document.querySelector('nav.slot-root')!;
    expect(nav.className.indexOf('slot-root')).toBeLessThan(nav.className.indexOf('user-last'));
  });

  it('style passthrough lên nav', () => {
    render(<TabMenu model={MODEL} style={{ padding: '2px' }} />);
    expect(document.querySelector('nav')).toHaveStyle({ padding: '2px' });
  });
});
