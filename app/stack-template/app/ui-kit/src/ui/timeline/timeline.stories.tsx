// Timeline stories — Default / ActivityFeed / CustomColors / Empty / DarkTheme
// + ActivityFeedMedia (rich media: avatar + thumbnail + icon-only bot event).
// Timeline is a pure display component (items read-only) — no controlled story.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/index';
import { Icon } from '../icons/index';
import { Text } from '../typography/index';
import { Timeline } from './index';

function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}
/** Vertical activity feed — dot + text + time per entry. */
const meta = { title: 'Data Display/Timeline', component: Timeline, tags: ['autodocs'] } satisfies Meta<typeof Timeline>;
export default meta;
type S = StoryObj<typeof meta>;

export const Default: S = {
  name: 'Default — accent dot + rail',
  args: { items: [
    { key: '1', children: 'Step 1 — initialized' },
    { key: '2', color: 'var(--st-done)', children: 'Step 2 — done', label: '10:00' },
  ] },
};

export const ActivityFeed: S = {
  args: { items: [] },
  name: 'Activity feed — time labels + status colors',
  render: () => (
    <div className="max-w-md">
      <Timeline items={[
        { key: 'a', color: 'var(--st-done)', children: 'alice created task "Design mockup"', label: '08:30' },
        { key: 'b', children: 'bob assigned the task to themselves', label: '09:15' },
        { key: 'c', color: 'var(--st-doing)', children: 'bob moved it to In progress', label: '09:20' },
        { key: 'd', color: 'var(--st-fail)', children: 'saga assignment failed — retrying', label: '09:25' },
      ]} />
    </div>
  ),
};

export const CustomColors: S = {
  args: { items: [] },
  name: 'Custom colors via tokens + default accent dot',
  render: () => (
    <Timeline items={[
      { key: '1', color: 'var(--st-done)', children: 'Done — token --st-done' },
      { key: '2', color: 'var(--st-doing)', children: 'Doing — token --st-doing' },
      { key: '3', children: 'No color — default accent dot' },
    ]} />
  ),
};

export const Empty: S = {
  name: 'Empty items — bare ol, no crash',
  args: { items: [] },
};

export const DarkTheme: S = {
  args: { items: [] },
  name: 'Dark theme — rail + dot follow tokens',
  render: () => (
    <div data-bp-theme="dark" className="max-w-md rounded-xl bg-s2 p-4">
      <Timeline items={[
        { key: '1', color: 'var(--st-done)', children: 'Deploy finished', label: '22:00' },
        { key: '2', children: 'CI green', label: '22:05' },
      ]} />
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: mode + pending) ──

export const AlternateMode: S = {
  name: 'Mode alternate — content alternates around the center rail',
  args: { items: [] },
  render: () => (
    <Timeline
      mode="alternate"
      items={[
        { key: '1', children: 'Sprint started', label: 'Mon 09:00' },
        { key: '2', color: 'var(--st-doing)', children: 'Mid-sprint review', label: 'Wed 14:00' },
        { key: '3', color: 'var(--st-done)', children: 'Released v1.2', label: 'Fri 18:00' },
      ]}
    />
  ),
};

export const Pending: S = {
  name: 'Pending — hollow dot continues from the last item',
  args: { items: [] },
  render: () => (
    <Timeline
      items={[
        { key: '1', children: 'Deploy finished', label: '22:00' },
        { key: '2', children: 'Smoke tests green', label: '22:05' },
      ]}
      pending={<>Rolling out to production…</>}
    />
  ),
};

// ── Rich media 2026-10-25 — activity feed như app thật: mỗi event có avatar
// người + action text + thumbnail đính kèm (picsum 120×80); bot event chỉ icon
// (không ảnh) — đúng mix của feed dev-tool (commit/deploy không có preview).

export const ActivityFeedMedia: S = {
  name: 'Activity feed with media — avatars, thumbnails, icon-only bot',
  args: { items: [] },
  render: () => (
    <div className="max-w-md">
      <Timeline
        items={[
          {
            key: 'm1',
            color: 'var(--st-done)',
            children: (
              <span className="flex items-start gap-2.5">
                <Avatar alt="Alice Nguyen" size={28} src={photo('alice-avatar', 56, 56)} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-body text-ink">
                    <Text strong>Alice Nguyen</Text> completed <Text strong>Design mockups</Text>
                  </span>
                  <img
                    alt="Design mockups — 3 mobile screens"
                    className="rounded-lg border border-line object-cover"
                    height={80}
                    src={photo('design-mockups', 120, 80)}
                    width={120}
                  />
                </span>
              </span>
            ),
            label: 'Today 08:30',
          },
          {
            key: 'm2',
            children: (
              <span className="flex items-start gap-2.5">
                <Avatar alt="Bob Pham" size={28} src={photo('bob-avatar', 56, 56)} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-body text-ink">
                    <Text strong>Bob Pham</Text> uploaded assets to <Text strong>Checkout v2</Text>
                  </span>
                  <img
                    alt="Product assets — hero banner"
                    className="rounded-lg border border-line object-cover"
                    height={80}
                    src={photo('checkout-assets', 120, 80)}
                    width={120}
                  />
                </span>
              </span>
            ),
            label: 'Today 09:12',
          },
          {
            key: 'm3',
            color: 'var(--st-doing)',
            children: (
              <span className="flex items-start gap-2.5">
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-pill bg-accent/10 text-accent">
                  <Icon name="refresh" size={14} />
                </span>
                <span className="pt-0.5 text-body text-ink">
                  <Text strong>Deploy bot</Text> started rolling out <Text code>web@1.4.2</Text>
                </span>
              </span>
            ),
            label: 'Today 09:40',
          },
          {
            key: 'm4',
            children: (
              <span className="flex items-start gap-2.5">
                <Avatar alt="Carol Le" size={28} src={photo('carol-avatar', 56, 56)} />
                <span className="pt-0.5 text-body text-ink">
                  <Text strong>Carol Le</Text> commented on <Text strong>API contract</Text>: “rename assigneeId?”
                </span>
              </span>
            ),
            label: 'Today 10:05',
          },
          {
            key: 'm5',
            color: 'var(--st-fail)',
            children: (
              <span className="flex items-start gap-2.5">
                <Avatar alt="Dave Vo" size={28} src={photo('dave-avatar', 56, 56)} />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-body text-ink">
                    <Text strong>Dave Vo</Text> reopened <Text strong>Safari login bug</Text>
                  </span>
                  <img
                    alt="Screenshot — expired token toast"
                    className="rounded-lg border border-line object-cover"
                    height={80}
                    src={photo('login-bug', 120, 80)}
                    width={120}
                  />
                </span>
              </span>
            ),
            label: 'Today 11:20',
          },
        ]}
      />
    </div>
  ),
};
