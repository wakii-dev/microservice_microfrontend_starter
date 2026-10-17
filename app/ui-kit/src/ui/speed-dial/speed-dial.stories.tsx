import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpeedDial } from './index';
const meta = { title: 'Navigation/SpeedDial', component: SpeedDial, tags: ['autodocs'] } satisfies Meta<typeof SpeedDial>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {
  args: { icon: '+', actions: [
    { key: 'a', icon: '📝', label: 'Tạo' },
    { key: 'b', icon: '📁', label: 'Danh mục' },
  ] },
};
