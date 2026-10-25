// Parity matrix antd→tokens: docs/parity-matrix.md
// Card stories — title/extra, hoverable, cover/actions, borderless, dark
// + ProductCard / ArticleCard (rich media, ảnh cover thật).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/index';
import { Rating } from '../rating/index';
import { Tag } from '../tag/index';
import { Text, Title } from '../typography/index';
import { Card } from './index';
import { Button } from '../button/index';

function photo(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

/** Grouped content panel with head / body / actions slots. */
const meta = { title: 'Data Display/Card', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  name: 'Basic — title + body',
  render: () => (
    <Card title="Task #42" className="w-96">
      Fix the Safari login bug — expired token not refreshed on the right branch.
    </Card>
  ),
};

export const TitleExtra: Story = {
  name: 'Title + extra',
  render: () => (
    <Card title="Weekly report" extra={<span className="text-meta">Updated 5 minutes ago</span>} className="w-96">
      12 tasks completed, 3 awaiting review, 1 blocked by an API bug.
    </Card>
  ),
};

export const Hoverable: Story = {
  name: 'Hoverable — hover lift + shadow (try hovering)',
  render: () => (
    <Card hoverable title="Hoverable card" extra={<a href="#" className="text-meta no-underline">Details</a>} className="w-96">
      Hover the card — s3 background + lift shadow, pointer cursor (antd hoverable).
      <div className="mt-4 flex gap-2">
        <Button type="primary" size="small">Take task</Button>
        <Button size="small">Skip</Button>
      </div>
    </Card>
  ),
};

export const Borderless: Story = {
  name: 'Borderless — bordered=false (stands out on canvas)',
  render: () => (
    <div className="flex gap-4">
      <Card title="With border" className="w-72">bordered=true by default.</Card>
      <Card title="Without border" bordered={false} className="w-72">bg-s2 container without border — best placed on canvas background.</Card>
    </div>
  ),
};

export const Cover: Story = {
  name: 'Cover — image above the head',
  render: () => (
    <Card
      title="Deploy WEEK-42"
      extra={<Tag>production</Tag>}
      cover={<div className="h-32 bg-gradient-to-r from-accent to-accent-hi" />}
      className="w-96"
    >
      Cover renders before the head — a full-width banner on top of the card.
    </Card>
  ),
};

export const Actions: Story = {
  name: 'Actions — button row below the body (border-l separators)',
  render: () => (
    <Card
      title="Task #42"
      actions={[
        <Button key="1" type="text" size="small">Take task</Button>,
        <Button key="2" type="text" size="small">Skip</Button>,
        <Button key="3" type="text" size="small" danger>Report blocker</Button>,
      ]}
      className="w-96"
    >
      Actions is a ReactNode array — flex-1 equal widths, separated by border-l.
    </Card>
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-96 rounded-xl bg-canvas p-4">
      <Card
        title="Task #42"
        extra={<span className="text-meta">5 minutes ago</span>}
        hoverable
        actions={[<Button key="1" type="text" size="small">Take task</Button>, <Button key="2" type="text" size="small">Skip</Button>]}
      >
        Card on dark canvas — dark bg-s2, dark border-line, hover lift unchanged.
      </Card>
    </div>
  ),
};

// ── Case-coverage audit 2026-10-18 (antd parity: loading + size) ──

export const Loading: Story = {
  name: 'Loading — skeleton body while data fetches',
  render: () => (
    <Card title="Task #42" loading className="w-96">
      This body is hidden while loading — skeleton text/row bones render instead.
    </Card>
  ),
};

export const SmallSize: Story = {
  name: 'Small size — dense padding (antd size="small")',
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <Card title="Default" extra={<span className="text-meta">24px</span>} className="w-72">
        Padding 24 — antd default size.
      </Card>
      <Card title="Small" extra={<span className="text-meta">12px</span>} size="small" className="w-72">
        Padding 12 — antd size="small" for dense dashboards.
      </Card>
    </div>
  ),
};

// ── Rich media 2026-10-25 — card thương mại/nội dung như app thật: ảnh cover
// (picsum 400×240) + Rating + giá + CTA; và article: tag chuyên mục + title +
// excerpt + author row (Avatar + tên + ngày).

export const ProductCard: Story = {
  name: 'Product card — cover photo, rating, price, add-to-cart',
  render: () => (
    <Card
      actions={[<Button key="add" type="primary" size="small">Add to cart</Button>]}
      className="w-96"
      cover={
        <img
          alt="Aurora wireless headphones — matte black over-ear"
          className="h-60 w-full object-cover"
          height={240}
          src={photo('headphones', 400, 240)}
          width={400}
        />
      }
      extra={<Tag>Audio</Tag>}
      hoverable
      title="Aurora Wireless Headphones"
    >
      <div className="flex items-center justify-between gap-2">
        <Rating readOnly value={4} />
        <span className="text-h3 font-semibold text-ink">$129</span>
      </div>
      <div className="mt-1">
        <Text type="secondary">40h battery · active noise cancelling · USB-C</Text>
      </div>
    </Card>
  ),
};

export const ArticleCard: Story = {
  name: 'Article card — cover, category tag, title, excerpt, author row',
  render: () => (
    <Card
      className="w-96"
      cover={
        <img
          alt="Neon skyline at night — cover for the dark mode article"
          className="h-60 w-full object-cover"
          height={240}
          src={photo('city-nights', 400, 240)}
          width={400}
        />
      }
      hoverable
    >
      <div className="flex flex-col gap-2">
        <span>
          <Tag>Engineering</Tag>
        </span>
        <Title level={4} style={{ marginBottom: 0 }}>
          Designing token-first dark mode
        </Title>
        <Text type="secondary">
          How one data-bp-theme attribute re-themes 90+ components through CSS variables — no reload,
          no duplicate stylesheet.
        </Text>
        <span className="mt-2 flex items-center gap-2 border-t border-line2 pt-3">
          <Avatar alt="Mai Tran" size={24} src={photo('mai-avatar', 48, 48)} />
          <span className="text-meta text-ink2">Mai Tran</span>
          <span className="ml-auto text-meta text-ink3">Oct 24, 2026</span>
        </span>
      </div>
    </Card>
  ),
};
