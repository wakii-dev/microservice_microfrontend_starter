import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './index';
const meta = { title: 'Navigation/Tabs', component: Tabs, tags: ['autodocs'] } satisfies Meta<typeof Tabs>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {
  args: { items: [
    { key: '1', label: 'Tab 1', children: <p>Nội dung 1</p> },
    { key: '2', label: 'Tab 2', children: <p>Nội dung 2</p> },
  ] },
};
