// AvatarGroup stories — Data Display. antd Avatar.Group parity (overlap, max →
// +N pill, name tooltip).
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

export const Max: Story = {
  name: 'Max 3 — overflow folds into +N (hover for names)',
  args: { items: TEAM, max: 3 },
};

export const Full: Story = {
  name: 'No max — all 5 avatars',
  args: { items: TEAM },
};

export const Fallback: Story = {
  name: 'No src — initials/fallback',
  args: {
    items: [
      { name: 'An Nguyen' },
      { name: 'Binh Tran', fallback: 'BT' },
      { name: 'Chi Le' },
    ],
  },
};

export const Size48: Story = {
  name: 'Size 48 — larger avatars, overlap ring still even',
  args: { items: TEAM, max: 4, size: 48 },
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  args: { items: TEAM, max: 3 },
  render: (args) => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <AvatarGroup {...args} />
    </div>
  ),
};
