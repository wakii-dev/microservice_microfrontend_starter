import type { Meta, StoryObj } from '@storybook/react-vite';
import { ColorPicker } from './index';
const meta = { title: 'Forms/ColorPicker', component: ColorPicker, tags: ['autodocs'] } satisfies Meta<typeof ColorPicker>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { value: '#1677ff' } };
