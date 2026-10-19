// InputNumber stories — full state matrix (user feedback: old stories were too thin).
// Component has NO size/height prop (input fixed h-8) → no Sizes story — demo only
// what the component exposes, no new props (docs/story boundary).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { InputNumber } from './index';

const meta = {
  title: 'Forms/InputNumber',
  component: InputNumber,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number', description: 'Clamp lower bound' },
    max: { control: 'number', description: 'Clamp upper bound' },
    step: { control: 'number', description: 'Stepper + arrow-key step' },
  },
} satisfies Meta<typeof InputNumber>;
export default meta;

type S = StoryObj<typeof meta>;

interface DemoProps {
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
}

/** Interactive demo: value={v ?? undefined} (prop is read at mount — state v only
 * DISPLAYS the emitted onChange value, it does not control the input). */
function Demo({
  min = 0,
  max = 100,
  step = 1,
  ariaLabel,
  hint,
  initial,
}: DemoProps & { hint?: string; initial?: number }) {
  const [v, setV] = useState<number | null>(initial ?? null);
  return (
    <div className="grid max-w-[320px] gap-3">
      <InputNumber
        ariaLabel={ariaLabel}
        min={min}
        max={max}
        step={step}
        value={v ?? undefined}
        onChange={setV}
      />
      <p className="m-0 font-mono text-meta text-ink3">
        {hint && <span className="block font-sans">{hint}</span>}
        min {min} · max {max} · step {step} → onChange:{' '}
        <strong className="text-ink">{v === null ? 'null' : v}</strong>
      </p>
    </div>
  );
}

/** Basic — numeric input with vertical stepper (Increment/Decrement). Demo min=0,
 * max=100, step=1; mono line under the input shows onChange in real time
 * (non-numeric text or empty → null). */
export const Basic: S = {
  args: { min: 0, max: 100, step: 1, ariaLabel: 'Quantity' },
  render: ({ min, max, step, ariaLabel }) => (
    <Demo
      ariaLabel={ariaLabel}
      initial={5}
      hint="Type a number or click the stepper buttons — emitted onChange value:"
      max={max}
      min={min}
      step={step}
    />
  ),
};

/** MinMaxClamp — type beyond a bound (e.g. 99 with max 10) then blur: onChange gets
 * the clamped 10 AND the input snaps to 10 (display syncs on blur — typing is not
 * forced); clear then blur → onChange(null). */
export const MinMaxClamp: S = {
  args: { min: 0, max: 10, step: 1, ariaLabel: 'Quantity (0–10)' },
  render: ({ min, max, step, ariaLabel }) => (
    <Demo
      ariaLabel={ariaLabel}
      hint="Try: type 99 → blur → input snaps to 10, onChange = 10. Clear → blur → onChange = null."
      max={max}
      min={min}
      step={step}
    />
  ),
};

export const Step5: S = {
  name: 'Step 5 — stepper ±5 + arrow keys',
  args: { min: 0, max: 100, step: 5, ariaLabel: 'Stepped quantity' },
  render: ({ min, max, step, ariaLabel }) => (
    <Demo
      ariaLabel={ariaLabel}
      hint="Stepper buttons and ↑↓ keys jump by 5 — from empty, the first bump lands on 5."
      initial={10}
      max={max}
      min={min}
      step={step}
    />
  ),
};

/** Disabled — input + stepper locked, group dimmed (bg-s3 + opacity). */
export const Disabled: S = {
  args: { disabled: true, value: 5, ariaLabel: 'Quantity (disabled)' },
};

/** Invalid — --st-fail red border on both input and stepper column (form
 * validation error state). */
export const Invalid: S = {
  args: { invalid: true, value: -1, min: 0, max: 100, ariaLabel: 'Quantity (invalid)' },
};

/** Keyboard — focus the input then press ↑ / ↓: step up/down (ArrowUp/ArrowDown
 * handled, page scroll prevented), still clamped to min/max. Stepper buttons emit
 * the same onChange shape. */
export const KeyboardArrow: S = {
  name: 'Keyboard ↑↓',
  args: { min: 0, max: 10, step: 2, ariaLabel: 'Quantity (↑↓)' },
  render: ({ min, max, step, ariaLabel }) => (
    <Demo
      ariaLabel={ariaLabel}
      initial={4}
      hint={`Focus the input then press ↑ / ↓ — ±${step} each, clamped [0, 10]:`}
      max={max}
      min={min}
      step={step}
    />
  ),
};

/** Sizes — small h-6 · middle h-8 (default) · large h-10, matching the Input family.
 * The flush stepper column scales with the control height (full-height halves). */
export const Sizes: S = {
  render: () => (
    <div className="grid w-64 gap-3">
      <InputNumber ariaLabel="Small quantity" size="small" value={5} min={0} max={99} />
      <InputNumber ariaLabel="Medium quantity" size="middle" value={5} min={0} max={99} />
      <InputNumber ariaLabel="Large quantity" size="large" value={5} min={0} max={99} />
      <p className="m-0 text-meta text-ink3">h-6 / h-8 / h-10 — stepper halves follow the control height.</p>
    </div>
  ),
};

/** Affixes — antd prefix/suffix inside the control: currency prefix, unit suffix.
 * Stepper stays flush at the right edge; ring on focus wraps the whole control. */
export const Affixes: S = {
  render: () => (
    <div className="grid w-72 gap-3">
      <InputNumber ariaLabel="Price" prefix={<span>$</span>} value={42} min={0} max={9999} step={1} />
      <InputNumber ariaLabel="Weight" suffix={<span>kg</span>} value={72} min={0} max={500} step={0.5} />
      <InputNumber ariaLabel="Percent" prefix={<span>↓</span>} suffix={<span>%</span>} value={30} min={0} max={100} />
      <p className="m-0 text-meta text-ink3">prefix → input → suffix → flush stepper (antd affix pattern).</p>
    </div>
  ),
};
