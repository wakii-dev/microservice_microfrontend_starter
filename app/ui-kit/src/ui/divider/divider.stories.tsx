// PARITY: antd Divider (margin 16px 0, dashed, with-text) vs ours.
import { Divider as AntdDivider } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Divider } from './index';

const meta = {
  title: 'Primitives/Divider',
  component: Divider,
  tags: ['autodocs'],
} satisfies Meta<typeof Divider>;
export default meta;

type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  render: () => (
    <Parity
      antd={
        <div style={{ width: 300 }}>
          <AntdDivider />
          <AntdDivider dashed />
          <AntdDivider>hoặc</AntdDivider>
        </div>
      }
      ours={
        <div style={{ width: 300 }}>
          <Divider />
          <Divider dashed />
          <Divider>hoặc</Divider>
        </div>
      }
    />
  ),
};
