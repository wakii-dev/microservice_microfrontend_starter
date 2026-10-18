// Mention stories — type @ to trigger the suggestion list, pick inserts "@Name ".
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mention } from './index';

const meta = { title: 'Forms/Mention', component: Mention, tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

const PEOPLE = ['An', 'Binh', 'Chi', 'Dung'];

/** Basic — type @ → suggestions → click/keyboard to pick. */
export const Basic: Story = {
  render: () => <Mention suggestions={PEOPLE} placeholder="Type @ to mention…" className="w-96" />,
};

/** Controlled — useState demo: value shown under the textarea. */
export const Controlled: Story = {
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="w-96">
        <Mention value={v} onChange={setV} suggestions={PEOPLE} placeholder="Type @ to mention…" />
        <p className="mt-2 font-mono text-meta text-ink3">value: <strong className="text-ink">{v || '—'}</strong></p>
      </div>
    );
  },
};

/** Empty — suggestions=[] → no dropdown even after @. */
export const Empty: Story = {
  args: { suggestions: [], placeholder: 'No one to mention…', className: 'w-96' },
};

/** DarkTheme — textarea + open suggestion list on dark canvas. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="w-96 rounded-xl bg-canvas p-4">
      <Mention suggestions={PEOPLE.slice(0, 3)} placeholder="Type @ to mention…" />
    </div>
  ),
};
