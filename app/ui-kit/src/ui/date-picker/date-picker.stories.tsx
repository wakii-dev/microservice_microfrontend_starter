import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from './index';
const meta = { title: 'Forms/DatePicker', component: DatePicker, tags: ['autodocs'] } satisfies Meta<typeof DatePicker>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { placeholder: 'Chọn ngày…' } };
export const Disabled: S = { args: { disabled: true, placeholder: 'Disabled' } };
