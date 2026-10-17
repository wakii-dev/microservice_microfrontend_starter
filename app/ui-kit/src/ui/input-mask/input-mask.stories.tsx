import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputMask } from './index';
const meta = { title: 'Forms/InputMask', component: InputMask, tags: ['autodocs'] } satisfies Meta<typeof InputMask>;
export default meta;
type S = StoryObj<typeof meta>;
export const Phone: S = { args: { mask: '9999-999-999', ariaLabel: 'SĐT', placeholder: '0909-123-456' } };
export const Date: S = { args: { mask: '99/99/9999', ariaLabel: 'Date', placeholder: 'DD/MM/YYYY' } };
