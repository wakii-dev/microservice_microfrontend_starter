import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Listbox } from './index';
const meta = { title: 'Data Display/Listbox', component: Listbox, tags: ['autodocs'] } satisfies Meta<typeof Listbox>;
export default meta;
type S = StoryObj<typeof meta>;

const PEOPLE = [
  { label: 'Alice Nguyen', value: 'alice' },
  { label: 'Binh Tran', value: 'binh' },
  { label: 'Chi Le', value: 'chi' },
];

/** Basic — inline list, preselected value. */
export const MacDinh: S = {
  args: { options: PEOPLE, value: 'alice' },
};

/** DisabledOption — one row locked (aria-disabled, not clickable). */
export const DisabledOption: S = {
  name: 'Disabled option — one locked row',
  args: {
    options: [
      { label: 'Alice Nguyen', value: 'alice' },
      { label: 'Binh Tran (on leave)', value: 'binh', disabled: true },
      { label: 'Chi Le', value: 'chi' },
    ],
    value: 'alice',
  },
};

/** Controlled — click a row → value shown below. */
export const Controlled: S = {
  args: { options: PEOPLE },
  render: () => <ListboxControlledDemo />,
};

/** DarkTheme — list on dark canvas. */
export const DarkTheme: S = {
  args: { options: PEOPLE },
  render: () => (
    <div data-bp-theme="dark" className="w-64 rounded-xl bg-canvas p-4">
      <Listbox options={PEOPLE} value="binh" />
    </div>
  ),
};

function ListboxControlledDemo() {
  const [v, setV] = useState('alice');
  return (
    <div className="grid max-w-[260px] gap-2">
      <Listbox options={PEOPLE} value={v} onChange={setV} />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v}</strong></p>
    </div>
  );
}
