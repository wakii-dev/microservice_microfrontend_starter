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

/** WithTextarea — long-text edit: display wraps to 2 lines, Textarea in the edit form. */
export const WithTextarea: Story = {
  name: 'With Textarea — long text edit',
  render: () => (
    <Inplace
      display={
        <span className="block max-w-[280px] text-body text-ink">
          Architecture overview — Module Federation host loading remotes through the nginx gateway.
        </span>
      }
    >
      <textarea
        aria-label="Edit description"
        defaultValue="Architecture overview — Module Federation host loading remotes through the nginx gateway."
        className="h-20 w-72 rounded-lg border border-line bg-canvas p-2 text-body text-ink"
      />
    </Inplace>
  ),
};

/** RichDisplay — Avatar + Tag + text row as the display node. */
export const RichDisplay: Story = {
  name: 'Rich display — Tag + text row',
  render: () => (
    <Inplace
      display={
        <span className="flex items-center gap-2">
          <span className="rounded-pill bg-accent/10 px-2 py-0.5 text-meta text-accent">owner</span>
          <span className="font-medium text-ink">alice@demo.local</span>
        </span>
      }
    >
      <Input defaultValue="alice@demo.local" aria-label="Edit owner" className="w-56" />
    </Inplace>
  ),
};

/** Controlled — useState demo: onClose fires when the edit form closes. */
export const Controlled: Story = {
  render: () => <InplaceControlledDemo />,
};

function InplaceControlledDemo() {
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
}
