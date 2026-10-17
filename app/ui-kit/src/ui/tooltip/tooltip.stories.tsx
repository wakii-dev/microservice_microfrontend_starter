// PARITY: antd Tooltip (bg spotlight rgba(0,0,0,.85), radius 6, arrow 8px).
import { Tooltip as AntdTooltip, Button as AntdButton } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Button } from '../button/index';
import { Tooltip } from './index';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;
export default meta;

type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  args: { title: 'Gợi ý', children: 'x' },
  render: () => (
    <Parity
      antd={
        <AntdTooltip title="Gợi ý từ antd">
          <AntdButton>Hover tôi</AntdButton>
        </AntdTooltip>
      }
      ours={
        <Tooltip title="Gợi ý từ ui-kit">
          <Button>Hover tôi</Button>
        </Tooltip>
      }
    />
  ),
};
