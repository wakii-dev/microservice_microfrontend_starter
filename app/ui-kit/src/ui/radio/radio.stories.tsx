// Radio stories — Radio (single) + RadioGroup (options list).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from './index';

const meta = { title: 'Forms/Radio', component: RadioGroup, tags: ['autodocs'] } satisfies Meta<typeof RadioGroup>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — group with 2 options. */
export const Basic: S = {
  args: {
    value: 'a',
    onChange: () => {},
    options: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
    ],
  },
};

/** Single — standalone Radio without a group. */
export const Single: S = {
  args: { options: [] },
  render: () => <Radio checked onChange={() => {}}>Standalone radio</Radio>,
};

/** WithDisabled — one option locked (per-option disabled). */
export const WithDisabled: S = {
  name: 'With disabled option',
  args: {
    value: 'a',
    onChange: () => {},
    options: [
      { label: 'Available', value: 'a' },
      { label: 'Unavailable', value: 'b', disabled: true },
    ],
  },
};

/** GroupDisabled — whole group locked (antd RadioGroup disabled). */
export const GroupDisabled: S = {
  name: 'Group disabled — all options locked',
  args: {
    value: 'a',
    disabled: true,
    onChange: () => {},
    options: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' },
    ],
  },
};

/** Controlled — useState demo: pick shows the selected value. */
export const Controlled: S = {
  args: { options: [] },
  render: () => <RadioGroupControlledDemo />,
};

/** DarkTheme — group on dark canvas. */
export const DarkTheme: S = {
  args: { options: [] },
  render: () => (
    <div data-bp-theme="dark" className="w-[280px] rounded-xl bg-canvas p-4">
      <RadioGroup
        value="a"
        onChange={() => {}}
        options={[
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ]}
      />
    </div>
  ),
};

function RadioGroupControlledDemo() {
  const [v, setV] = useState('fe');
  return (
    <div className="grid max-w-[320px] gap-3">
      <RadioGroup
        value={v}
        onChange={setV}
        options={[
          { label: 'Frontend', value: 'fe' },
          { label: 'Backend', value: 'be' },
          { label: 'DevOps', value: 'ops' },
        ]}
      />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v}</strong></p>
    </div>
  );
}

/* ── Customize pass (SÓNG-3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots + style passthrough (SÓNG-3
 * pattern). Radio: `root` on the <label>, `box` on the <input type=radio>,
 * `label` wraps the text children. RadioGroup: `root` on the radiogroup div.
 * `style` lands on that same root element; the user's className always comes last. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  args: { options: [] },
  render: () => <CustomStyledRadioDemo />,
};

function CustomStyledRadioDemo() {
  const [plan, setPlan] = useState('pro');
  return (
    <div className="grid max-w-[360px] gap-4">
      <RadioGroup
        value={plan}
        onChange={setPlan}
        aria-label="Custom styled group"
        style={{ padding: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
        classNames={{ root: 'rounded-lg bg-accent/5' }}
        options={[
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
        ]}
      />
      <Radio
        checked
        classNames={{
          root: 'rounded-lg bg-accent/5 px-2 py-1.5',
          box: 'border-accent',
          label: 'font-medium tracking-wide',
        }}
        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
      >
        Custom styled single radio
      </Radio>
    </div>
  );
}
