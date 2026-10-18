import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputOTP } from './index';

const meta = { title: 'Forms/InputOTP', component: InputOTP, tags: ['autodocs'] } satisfies Meta<typeof InputOTP>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — 6 cells, auto-advance on type. */
export const Basic: S = { args: { length: 6, ariaLabel: 'OTP code' } };

/** FourDigits — length=4 variant. */
export const FourDigits: S = { args: { length: 4, ariaLabel: 'PIN code' } };

/** Disabled — all cells locked. */
export const Disabled: S = { name: 'Disabled', args: { length: 6, value: '123456', disabled: true, ariaLabel: 'Locked OTP' } };

/** Controlled — useState demo: joined value displayed under the cells. */
export const Controlled: S = {
  render: () => <InputOtpControlledDemo />,
};

/** DarkTheme — cells on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-[360px] rounded-xl bg-canvas p-4">
      <InputOTP length={6} ariaLabel="OTP code" />
    </div>
  ),
};

function InputOtpControlledDemo() {
  const [v, setV] = useState('');
  return (
    <div className="grid max-w-[320px] gap-3">
      <InputOTP length={6} ariaLabel="OTP code" value={v} onChange={setV} />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v || '—'}</strong></p>
    </div>
  );
}
