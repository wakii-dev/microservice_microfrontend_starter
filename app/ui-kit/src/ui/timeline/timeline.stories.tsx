import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './index';
const meta = { title: 'Data Display/Timeline', component: Timeline, tags: ['autodocs'] } satisfies Meta<typeof Timeline>;
export default meta;
type S = StoryObj<typeof meta>;
export const MacDinh: S = {
  args: { items: [
    { key: '1', children: 'Bước 1 — khởi tạo' },
    { key: '2', color: 'var(--st-done)', children: 'Bước 2 — hoàn tất', label: '10:00' },
  ] },
};
