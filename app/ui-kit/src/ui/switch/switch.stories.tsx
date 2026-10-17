import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './index';
const meta = { title: 'Forms/Switch', component: Switch, tags: ['autodocs'] } satisfies Meta<typeof Switch>;
export default meta;
type S = StoryObj<typeof meta>;
function Demo() {
  const [on, setOn] = useState(false);
  return <Switch checked={on} onChange={setOn} checkedChildren="Bật" unCheckedChildren="Tắt" />;
}
export const CoBan: S = { render: () => <Demo /> };
export const Small: S = { args: { size: 'small', checked: true } };
