// PingFeed stories — team activity feed (Team-OS). Kinds: start/milestone/report/blocked.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PingFeed } from './index';

/** Activity feed with actor avatars, kind colors and relative timestamps. */
const meta = { title: 'Domain/PingFeed', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

const NOW = Date.now();
const at = (min: number) => new Date(NOW - min * 60000);

/** Basic — mixed kinds; blocked events light up the pulsing badge; idle-alert warning line. */
export const Basic: S = {
  render: () => (
    <PingFeed
      className="max-w-xl"
      events={[
        { at: at(2), actor: 'V1', kind: 'report', text: 'Responsive pre-pass 6 templates — 2 fix, 1 chuyển owner D.' },
        { at: at(14), actor: 'W6', kind: 'milestone', text: 'Tasks app-fit gate xanh 36/36.' },
        { at: at(33), actor: 'W8', kind: 'blocked', text: 'dark.css D1 block vỡ CSS — chờ owner sửa.' },
        { at: at(52), actor: 'D', kind: 'idle-alert', text: 'Agent idle 20 phút trong khi 2 debts mở — R0.1.' },
        { at: at(58), actor: 'V2', kind: 'start', text: 'Depth wave 2 — 6 component.' },
      ]}
    />
  ),
};

/** AllOperational — no blocked events: badge ẩn, chỉ feed. */
export const AllClear: S = {
  name: 'All clear — no blocked badge',
  render: () => (
    <PingFeed
      className="max-w-xl"
      events={[
        { at: at(1), actor: 'D', kind: 'milestone', text: 'Nav footer align contract v1.0.' },
        { at: at(45), actor: 'V7', kind: 'start', text: 'ChapterShell draft.' },
      ]}
    />
  ),
};

/** DarkTheme — same feed on dark canvas (tokens cascade). */
export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="p-2">
      <PingFeed
        className="max-w-xl"
        events={[
          { at: at(3), actor: 'V1', kind: 'report', text: 'Mop-up sweep 620/620 xanh.' },
          { at: at(26), actor: 'W6', kind: 'blocked', text: 'tsconfig hook test lỗi cú pháp.' },
        ]}
      />
    </div>
  ),
};
