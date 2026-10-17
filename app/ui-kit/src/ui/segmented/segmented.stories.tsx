import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Segmented } from './index';
const meta = { title: 'Navigation/Segmented', component: Segmented, tags: ['autodocs'] } satisfies Meta<typeof Segmented>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = { args: { options: [{ label: 'Ngày', value: 'day' }, { label: 'Tuần', value: 'week' }], value: 'day', onChange: () => {} } };
