import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Checkbox } from './index';
const meta = { title: 'Forms/Checkbox', component: Checkbox, tags: ['autodocs'] } satisfies Meta<typeof Checkbox>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { children: 'Nhớ tôi' } };
export const Checked: S = { args: { checked: true, children: 'Đã chọn' } };
export const Disabled: S = { args: { disabled: true, children: 'Không thể chọn' } };
