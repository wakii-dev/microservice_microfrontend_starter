// Inplace stories — click-to-edit toggle: display → edit form → × closes.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inplace } from './index';
import { Input } from '../input/index';

const meta = { title: 'Forms/Inplace', component: Inplace, tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

/** Basic — click the display to edit, × to close. */
export const Basic: Story = {
  render: () => (
    <Inplace display={<span className="font-medium">My project</span>}>
      <Input defaultValue="My project" aria-label="Edit name" className="w-56" />
    </Inplace>
  ),
};

/** Controlled — useState demo: onClose fires when the edit form closes. */
export const Controlled: Story = {
  render: () => {
    const [closed, setClosed] = useState(0);
    return (
      <div className="grid max-w-[320px] gap-3">
        <Inplace
          display={<span>Config A</span>}
          onClose={() => setClosed((n) => n + 1)}
        >
          <Input defaultValue="Config A" aria-label="Edit config" className="w-56" />
        </Inplace>
        <p className="m-0 font-mono text-meta text-ink3">onClose count: <strong className="text-ink">{closed}</strong></p>
      </div>
    );
  },
};
