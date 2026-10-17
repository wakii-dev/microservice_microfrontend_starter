import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toolbar } from './index';
const meta = { title: 'Navigation/Toolbar', component: Toolbar, tags: ['autodocs'] } satisfies Meta<typeof Toolbar>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {
  args: { children: <span>Công cụ</span>, extra: <span>Extra</span> },
};
