// Segmented stories — Default / Controlled (useState) / ManyOptions / DarkTheme.
// Component has NO disabled/size prop (see types) — don't invent variants.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Icon } from '../icons/index';
import { Segmented } from './index';
/** Compact single-choice switcher without content panels. */
const meta = { title: 'Navigation/Segmented', component: Segmented, tags: ['autodocs'] } satisfies Meta<typeof Segmented>;
export default meta;
type S = StoryObj<typeof meta>;

const OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export const Default: S = {
  name: 'Default — s2 thumb on s3 track',
  args: { options: OPTIONS, value: 'day', onChange: () => {} },
};

function ControlledDemo() {
  const [value, setValue] = useState('day');
  return (
    <div className="flex items-center gap-3">
      <Segmented options={OPTIONS} value={value} onChange={setValue} />
      <span className="text-label text-ink3">value: {value}</span>
    </div>
  );
}

export const Controlled: S = {
  args: { options: OPTIONS },
  name: 'Controlled — useState + value readout',
  render: () => <ControlledDemo />,
};

export const ManyOptions: S = {
  name: 'Many options — 5 items',
  args: {
    options: [...OPTIONS, { label: 'Quarter', value: 'quarter' }, { label: 'Year', value: 'year' }],
    value: 'quarter',
    onChange: () => {},
  },
};

export const IconOptions: S = {
  name: 'Icon options — Icon inside ReactNode label',
  args: {
    options: [
      {
        label: (
          <span className="flex items-center gap-1.5">
            <Icon name="calendar" size={14} />
            Schedule
          </span>
        ),
        value: 'schedule',
      },
      {
        label: (
          <span className="flex items-center gap-1.5">
            <Icon name="users" size={14} />
            Team
          </span>
        ),
        value: 'team',
      },
      {
        label: (
          <span className="flex items-center gap-1.5">
            <Icon name="file" size={14} />
            Docs
          </span>
        ),
        value: 'docs',
      },
    ],
    value: 'team',
    onChange: () => {},
  },
};

export const DarkTheme: S = {
  args: { options: OPTIONS },
  name: 'Dark theme — s2 thumb on s3 track',
  render: () => (
    <div data-bp-theme="dark" className="inline-flex rounded-xl bg-s2 p-4">
      <Segmented options={OPTIONS} value="week" onChange={() => {}} />
    </div>
  ),
};
