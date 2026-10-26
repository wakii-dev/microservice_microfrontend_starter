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
  render: () => <MentionControlledDemo />,
};

/** DarkTheme — textarea + open suggestion list on dark canvas. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="w-96 rounded-xl bg-canvas p-4">
      <Mention suggestions={PEOPLE.slice(0, 3)} placeholder="Type @ to mention…" />
    </div>
  ),
};

/** Empty — suggestions=[] → no dropdown even after @. */
export const Empty: Story = {
  args: { suggestions: [], placeholder: 'No one to mention…', className: 'w-96' },
};

function MentionControlledDemo() {
  const [v, setV] = useState('');
  return (
    <div className="w-96">
      <Mention value={v} onChange={setV} suggestions={PEOPLE} placeholder="Type @ to mention…" />
      <p className="mt-2 font-mono text-meta text-ink3">value: <strong className="text-ink">{v || '—'}</strong></p>
    </div>
  );
}

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / textarea / listbox /
 * option) + style passthrough. `root` lands on the outer relative div (same
 * element as `className`), `textarea` on the text field, `listbox`/`option` on
 * the mention dropdown; `style` lands on the root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="grid max-w-[320px] gap-4">
      <Mention
        suggestions={PEOPLE}
        placeholder="Type @ to mention…"
        classNames={{
          root: 'rounded-xl',
          textarea: 'border-st-done border-dashed',
          listbox: 'rounded-lg border-st-done',
          option: 'tracking-wide',
        }}
        style={{ padding: 6, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
      />
    </div>
  ),
};
