import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputOTP } from './index';
const meta = { title: 'Forms/InputOTP', component: InputOTP, tags: ['autodocs'] } satisfies Meta<typeof InputOTP>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { length: 6 } };
export const FourDigits: S = { args: { length: 4 } };
