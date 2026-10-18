import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputMask } from './index';

const meta = { title: 'Forms/InputMask', component: InputMask, tags: ['autodocs'] } satisfies Meta<typeof InputMask>;
export default meta;
type S = StoryObj<typeof meta>;

/** Phone mask — digits + literal dash (9= digit). */
export const Phone: S = { args: { mask: '9999-999-999', ariaLabel: 'Phone', placeholder: '0909-123-456' } };

/** Date mask — nested literals DD/MM/YYYY. */
export const Date: S = { args: { mask: '99/99/9999', ariaLabel: 'Date', placeholder: 'DD/MM/YYYY' } };

/** Controlled — useState demo: masked value shown next to the input. */
export const Controlled: S = {
  args: { mask: '99/99/9999' },
  render: () => {
    const [v, setV] = useState('');
    return (
      <div className="grid max-w-[280px] gap-3">
        <InputMask mask="99/99/9999" ariaLabel="Date of birth" placeholder="DD/MM/YYYY" value={v} onChange={setV} />
        <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v || '—'}</strong></p>
      </div>
    );
  },
};

/** Disabled — locked input (passthrough via native rest props). */
export const Disabled: S = {
  args: { mask: '9999-999-999', ariaLabel: 'Locked phone', value: '0909-123-456', disabled: true },
};

/** CommonMasks — three common patterns side by side. */
export const CommonMasks: S = {
  args: { mask: '9999-999-999' },
  render: () => (
    <div className="grid max-w-[280px] gap-3">
      <InputMask mask="9999-999-999" ariaLabel="Phone number" placeholder="0909-123-456" />
      <InputMask mask="aa-99" ariaLabel="Stock code" placeholder="AB-12" />
      <InputMask mask="99/99/9999" ariaLabel="Day" placeholder="DD/MM/YYYY" />
    </div>
  ),
};
