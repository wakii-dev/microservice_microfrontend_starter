// PARITY matrix: xem .storybook/Parity.tsx (colorText/radius/fontSize mapping tokens).
import { Typography as AntdTypography, Button as AntdButton } from 'antd';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Parity } from '../../../.storybook/Parity';
import { Typography } from './index';

const { Title, Text, Paragraph } = Typography;

const meta = {
  title: 'Primitives/Typography',
  component: Title,
  tags: ['autodocs'],
} satisfies Meta<typeof Title>;
export default meta;

type Story = StoryObj<typeof meta>;

export const ParityVsAntd: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Parity
        antd={
          <AntdTypography>
            <AntdTypography.Title level={4}>Tiêu đề level 4</AntdTypography.Title>
            <AntdTypography.Text type="danger">Lỗi đỏ</AntdTypography.Text>{' '}
            <AntdTypography.Text code>wakii</AntdTypography.Text>
            <AntdTypography.Paragraph type="secondary">Mô tả phụ.</AntdTypography.Paragraph>
            <AntdButton type="primary">Primary</AntdButton>
          </AntdTypography>
        }
        ours={
          <div>
            <Title level={4}>Tiêu đề level 4</Title>
            <Text type="danger">Lỗi đỏ</Text> <Text code>wakii</Text>
            <Paragraph type="secondary">Mô tả phụ.</Paragraph>
            <p>
              <Button type="primary">Primary</Button>
            </p>
          </div>
        }
      />
    </div>
  ),
};
