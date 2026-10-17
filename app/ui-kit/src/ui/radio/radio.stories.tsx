import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { RadioGroup } from './index';
const meta = { title: 'Forms/Radio', component: RadioGroup, tags: ['autodocs'] } satisfies Meta<typeof RadioGroup>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { value: 'a', onChange: () => {}, options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }] } };
