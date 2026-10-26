// Parity matrix antd→tokens: docs/parity-matrix.md
// Anchor stories — scroll the preview page: active dot follows the section in view.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Anchor, type AnchorLinkItem } from './index';

/** Anchor navigation — jump links synced with scroll position. */
const meta = { title: 'Navigation/Anchor', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Section({ id, title }: { id: string; title: string }) {
  return (
    <section id={id} className="rounded-xl border border-line bg-s2 p-6">
      <h3 className="m-0 mb-2 text-h2 font-semibold text-ink">{title}</h3>
      <p className="m-0 text-body text-ink2">
        Scroll this preview — the anchor dot on the left turns accent when this section reaches the
        top of the viewport.
      </p>
      <div className="h-64" />
    </section>
  );
}

const BASIC_ITEMS: AnchorLinkItem[] = [
  { key: 'intro', href: '#anchor-sb-intro', title: 'Introduction' },
  { key: 'usage', href: '#anchor-sb-usage', title: 'Usage' },
  { key: 'api', href: '#anchor-sb-api', title: 'API reference' },
];

export const Basic: Story = {
  name: 'Basic — scroll-spy + smooth click',
  render: () => (
    <div className="flex gap-8">
      <Anchor items={BASIC_ITEMS} />
      <div className="flex flex-1 flex-col gap-6">
        <Section id="anchor-sb-intro" title="Introduction" />
        <Section id="anchor-sb-usage" title="Usage" />
        <Section id="anchor-sb-api" title="API reference" />
      </div>
    </div>
  ),
};

export const WithAffix: Story = {
  name: 'With affix — anchor stays pinned while scrolling',
  render: () => (
    <div className="flex gap-8">
      <Anchor items={BASIC_ITEMS} affix offsetTop={16} />
      <div className="flex flex-1 flex-col gap-6">
        <Section id="anchor-sb-intro" title="Introduction" />
        <Section id="anchor-sb-usage" title="Usage" />
        <Section id="anchor-sb-api" title="API reference" />
      </div>
    </div>
  ),
};

export const Nested: Story = {
  name: 'Nested — children indent with their own rail',
  render: () => (
    <div className="flex gap-8">
      <Anchor
        items={[
          {
            key: 'guide',
            href: '#anchor-sb-intro',
            title: 'Guide',
            children: [
              { key: 'install', href: '#anchor-sb-usage', title: 'Installation' },
              { key: 'advanced', href: '#anchor-sb-api', title: 'Advanced usage' },
            ],
          },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6">
        <Section id="anchor-sb-intro" title="Guide" />
        <Section id="anchor-sb-usage" title="Installation" />
        <Section id="anchor-sb-api" title="Advanced usage" />
      </div>
    </div>
  ),
};

export const CustomOffset: Story = {
  name: 'Custom offsetTop — activates 96px before the section top',
  render: () => (
    <div className="flex gap-8">
      <Anchor items={BASIC_ITEMS} offsetTop={96} onClick={(_e, link) => console.log('anchor:', link.href)} />
      <div className="flex flex-1 flex-col gap-6">
        <Section id="anchor-sb-intro" title="Introduction" />
        <Section id="anchor-sb-usage" title="Usage" />
        <Section id="anchor-sb-api" title="API reference" />
      </div>
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the nav, `list` on
 * every level <ul>, `item` on links, `dot` on rail dots; `style` lands on root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Anchor
      style={{ padding: 8 }}
      classNames={{
        root: 'rounded-xl border border-dashed border-accent bg-accent/5',
        item: 'uppercase tracking-wide',
        dot: 'size-2',
      }}
      items={[
        { href: '#anchor-a', title: 'Alpha' },
        { href: '#anchor-b', title: 'Beta' },
      ]}
    />
  ),
};
