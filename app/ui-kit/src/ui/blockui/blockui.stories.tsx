import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlockUI } from './index';
const meta = { title: 'Feedback/BlockUI', component: BlockUI, tags: ['autodocs'] } satisfies Meta<typeof BlockUI>;
export default meta;
type S = StoryObj<typeof meta>;
export const Blocked: S = { args: { blocked: true, message: 'Đang xử lý…', children: <div className="p-8">Content bị block</div> } };
export const Unblocked: S = { args: { blocked: false, children: <div className="p-8">Content bình thường</div> } };
