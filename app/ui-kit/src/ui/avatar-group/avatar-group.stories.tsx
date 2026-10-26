// AvatarGroup stories — Data Display. antd Avatar.Group parity (overlap, max →
// +N pill, name tooltip).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarGroup } from './index';
import { Card } from '../../index.js';

/** Stacked avatars with overflow folded into a +N pill. */
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

// ── Real-world usage (2026-10-25): photo groups in product contexts ──

/** Seeded picsum helper — deterministic real photo per person (same contract as image.stories). */
function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const ASSIGNEES = [
  { src: photo('assignee-mai', 96, 96), name: 'Mai Pham' },
  { src: photo('assignee-hung', 96, 96), name: 'Hung Bui' },
  { src: photo('assignee-lan', 96, 96), name: 'Lan Do' },
  { src: photo('assignee-khoa', 96, 96), name: 'Khoa Tran' },
  { src: photo('assignee-giang', 96, 96), name: 'Giang Vo' },
];

/** TaskAssignees — ticket header pattern: who is on it, overflow folds into +N. */
export const TaskAssignees: Story = {
  name: 'Task assignees — ticket header, photos with +N overflow',
  args: { items: ASSIGNEES, max: 3, size: 28 },
  render: (args) => (
    <div className="w-full max-w-md rounded-xl border border-line bg-s1 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-body font-medium text-ink">Migrate design tokens to 0.4.0</span>
        <span className="shrink-0 font-mono text-meta text-ink3">ORCA-101</span>
      </div>
      <div className="mt-3">
        <AvatarGroup {...args} />
      </div>
      <p className="m-0 mt-2 text-meta text-ink3">5 assignees — hover the +N pill to see who is folded in.</p>
    </div>
  ),
};

const ATTENDEES = [
  { src: photo('attendee-mai', 96, 96), name: 'Mai Pham' },
  { src: photo('attendee-hung', 96, 96), name: 'Hung Bui' },
  { src: photo('attendee-lan', 96, 96), name: 'Lan Do' },
  { src: photo('attendee-khoa', 96, 96), name: 'Khoa Tran' },
  { src: photo('attendee-giang', 96, 96), name: 'Giang Vo' },
  { src: photo('attendee-tu', 96, 96), name: 'Tu Nguyen' },
];

/** MeetingAttendees — who is coming, as an avatar strip under a card title. */
export const MeetingAttendees: Story = {
  name: 'Meeting attendees — avatar strip under a card title',
  args: { items: ATTENDEES, size: 32 },
  render: (args) => (
    <Card title="Design review — Thursday 10:00" className="max-w-sm">
      <AvatarGroup {...args} />
      <p className="m-0 mt-2 text-meta text-ink3">6 invited · 4 accepted — hover an avatar for the full name.</p>
    </Card>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the stack
 * wrapper; `style` lands on the same div. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  args: {
    max: 3,
    items: [
      { name: 'Ada Lovelace' },
      { name: 'Grace Hopper' },
      { name: 'Linus Torvalds' },
      { name: 'Edsger Dijkstra' },
    ],
    classNames: { root: 'rounded-pill border border-dashed border-accent bg-accent/5 p-2' },
    style: { padding: 8, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' },
  },
};
