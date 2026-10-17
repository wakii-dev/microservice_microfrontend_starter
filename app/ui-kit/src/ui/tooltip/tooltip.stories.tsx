// Parity matrix antd→tokens: docs/parity-matrix.md
// Tooltip stories — placement top/bottom (component hỗ trợ 2 hướng, không phải
// 4), trigger hover + focus.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Tooltip } from './index';

const meta = { title: 'Primitives/Tooltip', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  name: 'Placement top (mặc định) — hover thử',
  render: () => (
    <Tooltip title="Đây là tooltip phía trên">
      <Button>Hover tôi</Button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  name: 'Placement bottom',
  render: () => (
    <Tooltip title="Tooltip phía dưới" placement="bottom">
      <Button>Hover tôi</Button>
    </Tooltip>
  ),
};

export const Trigger: Story = {
  name: 'Trigger — hover + focus (keyboard Tab)',
  render: () => (
    <div className="flex gap-4">
      <Tooltip title="Nút focus được — Tab tới đây sẽ hiện bubble">
        <Button>Focus/hover</Button>
      </Tooltip>
      <Tooltip title="Link cũng nhận focus" placement="bottom">
        <a href="#" className="text-accent no-underline">
          Link demo
        </a>
      </Tooltip>
    </div>
  ),
};
