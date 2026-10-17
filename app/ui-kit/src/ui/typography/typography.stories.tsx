// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Typography } from './index';

const { Title, Text, Paragraph } = Typography;

const meta = {
  title: 'Primitives/Typography',
  component: Title,
  tags: ['autodocs'],
} satisfies Meta<typeof Title>;
export default meta;

type Story = StoryObj<typeof meta>;

