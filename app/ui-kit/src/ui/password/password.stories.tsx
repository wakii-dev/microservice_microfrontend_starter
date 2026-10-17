import type { Meta, StoryObj } from '@storybook/react-vite';
import { Password } from './index';
const meta = { title: 'Forms/Password', component: Password, tags: ['autodocs'] } satisfies Meta<typeof Password>;
export default meta;
type S = StoryObj<typeof meta>;
export const CoBan: S = { args: { ariaLabel: 'pw', placeholder: 'Nhập mật khẩu' } };
export const Strength: S = { args: { ariaLabel: 'pw2', showStrength: true, value: 'Strong1!' } };
