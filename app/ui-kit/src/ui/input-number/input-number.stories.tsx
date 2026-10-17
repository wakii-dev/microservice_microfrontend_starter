import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { InputNumber } from './index';
const meta = { title: 'Forms/InputNumber', component: InputNumber, tags: ['autodocs'] } satisfies Meta<typeof InputNumber>;
export default meta;
type S = StoryObj<typeof meta>;
function Demo() {
  const [v, setV] = useState<number | null>(5);
  return <InputNumber ariaLabel="Số lượng" value={v ?? 0} onChange={(n) => setV(n)} min={0} max={100} />;
}
export const CoBan: S = { render: () => <Demo /> };
export const Disabled: S = { args: { disabled: true, ariaLabel: 'disabled' } };
