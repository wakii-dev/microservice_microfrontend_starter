// Parity matrix antd→tokens: docs/parity-matrix.md
// Descriptions stories — bordered/plain.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Descriptions } from './index';

const meta = { title: 'Data Display/Descriptions', component: Descriptions, tags: ['autodocs'] } satisfies Meta<typeof Descriptions>;
export default meta;
type Story = StoryObj<typeof meta>;

const ITEMS = [
  { label: 'Người tạo', children: 'Alice' },
  { label: 'Trạng thái', children: 'Đang làm' },
  { label: 'Hạn', children: '2026-10-20' },
];

