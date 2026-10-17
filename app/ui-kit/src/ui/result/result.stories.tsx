// Parity matrix antd→tokens: docs/parity-matrix.md
// Result stories — success/404/500.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Result } from './index';

const meta = { title: 'Feedback/Result', component: Result, tags: ['autodocs'] } satisfies Meta<typeof Result>;
export default meta;
type Story = StoryObj<typeof meta>;

