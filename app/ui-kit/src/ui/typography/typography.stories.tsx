// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography } from './index';

const { Title, Text, Paragraph } = Typography;

/** Text primitives — Title/Text/Paragraph with type colors. */
const meta = {
  title: 'Primitives/Typography',
  
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const CacCapTitle: Story = {
  name: 'Title — level 1–5',
  render: () => (
    <div className="flex flex-col gap-2">
      <Title level={1}>H1 — Trang (38px)</Title>
      <Title level={2}>H2 — Section (30px)</Title>
      <Title level={3}>H3 — Panel (24px)</Title>
      <Title level={4}>H4 — Nhóm (20px)</Title>
      <Title level={5}>H5 — Nhỏ (16px)</Title>
    </div>
  ),
};

export const TextKieuMau: Story = {
  name: 'Text — color types + strong',
  render: () => (
    <div className="flex flex-col gap-2">
      <Text>Text mặc định (default)</Text>
      <Text type="secondary">Text secondary (nhạt — mô tả)</Text>
      <Text type="success">Text success (thành công)</Text>
      <Text type="warning">Text warning (cảnh báo)</Text>
      <Text type="danger">Text danger (lỗi)</Text>
      <Text strong>Text strong (đậm)</Text>
    </div>
  ),
};

export const TextTrangTri: Story = {
  name: 'Text — underline/delete/code/keyboard + copyable',
  render: () => (
    <div className="flex flex-col gap-2">
      <Text underline>Gạch dưới (underline)</Text>
      <Text delete>Gạch ngang (delete)</Text>
      <Text code>Đoạn code inline</Text>
      <Text keyboard>Ctrl</Text> + <Text keyboard>K</Text>
      <Text copyable>Nội dung copy được — click icon để copy</Text>
    </div>
  ),
};

export const ParagraphMacDinh: Story = {
  name: 'Paragraph — body block',
  render: () => (
    <Paragraph>
      Đoạn văn bản dài — Typography giữ metrics antd: fontSize 14, lineHeight thoáng,
      màu mực chính. Dùng cho nội dung thân bài, mô tả dài trong panel.
    </Paragraph>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on each element
 * (Title heading / Text span / Paragraph <p>), `wrapper` on the Text outer
 * span; `style` merges after the antd metric styles. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div>
      <Title level={3} classNames={{ root: 'uppercase tracking-wide text-accent' }} style={{ fontSize: 28 }}>
        Slotted heading
      </Title>
      <Text type="secondary" classNames={{ root: 'italic', wrapper: 'inline-block' }}>
        Secondary copy with a wrapper slot
      </Text>
      <Paragraph classNames={{ root: 'text-accent' }} style={{ marginTop: 8 }}>
        Paragraph slot recolors the whole block without touching structural styles.
      </Paragraph>
    </div>
  ),
};
