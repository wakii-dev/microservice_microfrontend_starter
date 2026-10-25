import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './index';
import { Tag } from '../../index.js';
/** Identity chip — letter initials by default, photo via `src`. */
const meta = { title: 'Data Display/Avatar', component: Avatar, tags: ['autodocs'] } satisfies Meta<typeof Avatar>;
export default meta;
type S = StoryObj<typeof meta>;

export const Basic: S = { name: 'Basic — letter', args: { children: 'A' } };
export const Image: S = { name: 'Image — src + alt', args: { src: 'https://i.pravatar.cc/150?img=1', alt: 'user' } };
export const Square48: S = { name: 'Square 48', args: { children: 'B', size: 48, shape: 'square' } };

export const Sizes: S = {
  name: 'Sizes — 24/32/48/64 (circle + square)',
  render: () => (
    <div className="flex items-end gap-4">
      {[24, 32, 48, 64].map((s) => (
        <Avatar key={`c${s}`} size={s}>
          {s}
        </Avatar>
      ))}
      {[24, 32, 48, 64].map((s) => (
        <Avatar key={`s${s}`} size={s} shape="square">
          {s}
        </Avatar>
      ))}
    </div>
  ),
};

export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="flex w-fit gap-3 rounded-xl bg-canvas p-4">
      <Avatar>VN</Avatar>
      <Avatar src="https://i.pravatar.cc/150?img=3" alt="user 3" size={48} />
      <Avatar size={48} shape="square">
        QT
      </Avatar>
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: src error fallback) ──

export const BrokenSrcFallback: S = {
  name: 'Broken src — falls back to initials on error',
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar src="https://example.com/missing.jpg" alt="Hai">HB</Avatar>
      <Avatar src="https://example.com/missing.jpg" alt="Team" shape="square">TM</Avatar>
      <span className="text-meta text-ink2">← initials replace broken images</span>
    </div>
  ),
};

// ── Real-world usage (2026-10-25): photo avatars in product contexts ──

/** Seeded picsum helper — deterministic real photo per person (same contract as image.stories). */
function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const COMMENTS = [
  {
    seed: 'avatar-mai',
    name: 'Mai Pham',
    time: '12 minutes ago',
    body: 'Deployed the new onboarding flow to staging — take a look when you get a chance.',
  },
  {
    seed: 'avatar-hung',
    name: 'Hung Bui',
    time: '34 minutes ago',
    body: 'Nice. The step indicator feels much snappier with the 160ms transition.',
  },
  {
    seed: 'avatar-lan',
    name: 'Lan Do',
    time: '1 hour ago',
    body: 'Left two small copy suggestions on step 3, everything else LGTM.',
  },
];

/** CommentThread — the most common real-world avatar: photo identity next to a message. */
export const CommentThread: S = {
  name: 'In a comment thread — 40px photo avatars beside messages',
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-4 rounded-xl border border-line bg-s1 p-5">
      {COMMENTS.map((c) => (
        <div key={c.seed} className="flex items-start gap-3">
          <Avatar src={photo(c.seed, 96, 96)} alt={c.name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-body font-medium text-ink">{c.name}</span>
              <span className="text-meta text-ink3">{c.time}</span>
            </div>
            <p className="m-0 mt-0.5 text-body text-ink2">{c.body}</p>
          </div>
        </div>
      ))}
    </div>
  ),
};

const TEAM_MEMBERS = [
  { seed: 'avatar-mai', name: 'Mai Pham', role: 'Design Lead', status: 'online', dot: 'bg-st-done' },
  { seed: 'avatar-hung', name: 'Hung Bui', role: 'Frontend Engineer', status: 'online', dot: 'bg-st-done' },
  { seed: 'avatar-lan', name: 'Lan Do', role: 'QA Engineer', status: 'away', dot: 'bg-st-doing' },
  { seed: 'avatar-khoa', name: 'Khoa Tran', role: 'Product Manager', status: 'busy', dot: 'bg-st-fail' },
];

/** TeamPage — member directory rows: photo avatar + name/role + presence tag. */
export const TeamPage: S = {
  name: 'Team page — member rows with photo, role, presence',
  render: () => (
    <div className="w-full max-w-md rounded-xl border border-line bg-s1 p-2">
      {TEAM_MEMBERS.map((m) => (
        <div key={m.name} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-s3">
          <Avatar src={photo(m.seed, 96, 96)} alt={m.name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="text-body font-medium text-ink">{m.name}</div>
            <div className="text-meta text-ink3">{m.role}</div>
          </div>
          <Tag icon={<span aria-hidden="true" className={`inline-block size-1.5 rounded-pill ${m.dot}`} />}>
            {m.status}
          </Tag>
        </div>
      ))}
    </div>
  ),
};
