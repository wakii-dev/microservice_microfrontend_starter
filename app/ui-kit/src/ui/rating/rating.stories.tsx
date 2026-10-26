import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Rating } from './index';
const meta = { title: 'Forms/Rating', component: Rating, tags: ['autodocs'] } satisfies Meta<typeof Rating>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — 5 stars, click to rate (hover previews). */
export const MacDinh: S = { name: 'Basic — click to rate' };

/** CustomMax — 10-star scale (antd Rate count). */
export const CustomMax: S = { name: 'Custom max — 10 stars', args: { value: 6, max: 10 } };

/** ReadOnly — stars render but clicks are locked (display-only score). */
export const ReadOnly: S = { args: { value: 3, readOnly: true } };

/** Disabled — locked + dimmed (antd Rate disabled). */
export const Disabled: S = { args: { value: 2, disabled: true } };

/** Controlled — hover preview + picked value shown below. */
export const Controlled: S = {
  render: () => <RatingControlledDemo />,
};

/** DarkTheme — stars on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-fit rounded-xl bg-canvas p-4">
      <Rating value={4} />
    </div>
  ),
};

function RatingControlledDemo() {
  const [v, setV] = useState(0);
  return (
    <div className="grid max-w-[240px] gap-2">
      <Rating value={v} onChange={setV} />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v}</strong></p>
    </div>
  );
}

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / star) + style
 * passthrough. `root` lands on the radiogroup div (same element as
 * `className`), `star` on every star button; `style` lands on the root. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  args: { value: 3 },
  render: (args) => (
    <Rating
      {...args}
      classNames={{
        root: 'gap-1',
        star: 'text-xl',
      }}
      style={{ padding: 6, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
    />
  ),
};
