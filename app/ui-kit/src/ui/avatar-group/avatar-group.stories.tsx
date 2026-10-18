// Stories AvatarGroup — Data Display. Parity antd Avatar.Group (overlap, max →
// +N, tooltip tên).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from './index';

const meta = {
  title: 'Data Display/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof AvatarGroup>;
export default meta;

type Story = StoryObj<typeof meta>;

const TEAM = [
  { src: 'https://i.pravatar.cc/150?img=1', name: 'An Nguyen' },
  { src: 'https://i.pravatar.cc/150?img=2', name: 'Binh Tran' },
  { src: 'https://i.pravatar.cc/150?img=3', name: 'Chi Le' },
  { src: 'https://i.pravatar.cc/150?img=4', name: 'Duong Pham' },
  { src: 'https://i.pravatar.cc/150?img=5', name: 'Giang Vo' },
];

export const AvatarGroupMax: Story = {
  name: 'Max 3 — dư gộp +N (hover xem tên)',
  args: { items: TEAM, max: 3 },
};

export const Du: Story = {
  name: 'Không max — đủ 5 avatar',
  args: { items: TEAM },
};

export const Fallback: Story = {
  name: 'Không src — initials/fallback',
  args: {
    items: [
      { name: 'An Nguyen' },
      { name: 'Binh Tran', fallback: 'BT' },
      { name: 'Chi Le' },
    ],
  },
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  args: { items: TEAM, max: 3 },
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <AvatarGroup items={TEAM} max={3} />
    </div>
  ),
};
