// BottomNavigation stories — fixed bottom bar, active accent, hideOnScroll.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../icons/index';
import { BottomNavigation } from './index';

/** Bottom bar for mobile screens — fixed, active accent, optional hideOnScroll. */
const meta = { title: 'Navigation/BottomNavigation', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  { key: 'home', label: 'Home', icon: <Icon name="home" size={16} /> },
  { key: 'tasks', label: 'Tasks', icon: <Icon name="menu-bars" size={16} /> },
  { key: 'board', label: 'Board', icon: <Icon name="file" size={16} /> },
  { key: 'me', label: 'Me', icon: <Icon name="user" size={16} /> },
];

/** Basic — 4 tabs, tap to switch (active pops via bp-switch-pop). */
export const Basic: Story = {
  render: () => <BottomNavigationDemo />,
};

function BottomNavigationDemo() {
  const [active, setActive] = useState('home');
  return (
    <div className="relative h-32 overflow-hidden rounded-xl border border-line bg-canvas">
      <p className="p-4 text-body text-ink2">active: {active}</p>
      <BottomNavigation items={ITEMS} value={active} onChange={setActive} ariaLabel="Primary" />
    </div>
  );
}

/** HideOnScroll — scroll the PAGE down (use the button): the bar slides away; scroll up brings it back. */
export const HideOnScroll: Story = {
  name: 'HideOnScroll — hides scrolling down, returns scrolling up',
  render: () => (
    <div>
      <p className="text-label text-ink3">
        Scroll the page (or click the button) — the bar hides past 40px of downward scroll.
      </p>
      <div className="my-3">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
          className="cursor-pointer rounded-lg border border-line bg-s2 px-3 py-1.5 text-body text-ink hover:bg-s3"
        >
          Scroll down ↓
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-s2 p-3 text-body text-ink2">
            Filler block {i + 1}
          </div>
        ))}
      </div>
      <BottomNavigation items={ITEMS} ariaLabel="Primary" hideOnScroll />
    </div>
  ),
};

/** DarkTheme — bar + active accent follow tokens on dark canvas. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="relative h-32 overflow-hidden rounded-xl bg-canvas">
      <BottomNavigation items={ITEMS} defaultValue="tasks" ariaLabel="Primary" />
    </div>
  ),
};
