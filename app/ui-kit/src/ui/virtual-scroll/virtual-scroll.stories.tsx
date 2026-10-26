// Parity matrix PrimeReact→tokens: docs/parity-matrix.md
// VirtualScroll stories — 10k rows, List virtual integration, load-more on scroll
// end, fixed-height note (dynamic row height NOT supported — needs measuring).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { List } from '../list/index';
import { message } from '../message/index';
import { VirtualScroll } from './index';

/** Windowed list for long data — constant DOM node count. */
const meta = { title: 'Data Display/VirtualScroll', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Row({ i, suffix }: { i: number; suffix?: string }) {
  return (
    <div className="flex h-12 items-center border-b border-line2 px-4 text-body text-ink2">
      <span className="text-ink">Row {i}</span>
      {suffix ? <span className="ml-2 text-meta text-ink3">{suffix}</span> : null}
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic — 10,000 rows, fixed itemSize 48',
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-meta text-ink3">
        10,000 items mounted — only ~13 rows exist in the DOM at any time (window + buffer 5).
      </p>
      <VirtualScroll
        items={Array.from({ length: 10000 }, (_, i) => i)}
        itemSize={48}
        height={360}
        renderItem={(i) => <Row i={i} />}
        className="rounded-xl border border-line bg-s2"
      />
    </div>
  ),
};

export const ListVirtual: Story = {
  name: 'List virtual — List integration for long feeds',
  render: () => (
    <List
      items={Array.from({ length: 5000 }, (_, i) => i)}
      renderItem={(i: number) => <span>Task #{i + 1} — synced from Kafka feed</span>}
      virtual
      virtualItemSize={48}
      virtualHeight={320}
      bordered
      header="5,000 tasks (virtual)"
      footer="Scroll inside the list — rows mount/unmount as you go."
    />
  ),
};

function ScrollEndDemo() {
  const [count, setCount] = useState(50);
  const loadMore = () => {
    setCount((c) => c + 50);
    message.info(`Loaded 50 more — total ${count + 50}`);
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-meta text-ink3">
        Hit the bottom of the scroller — onScrollEnd appends 50 rows (fires once per approach).
      </p>
      <VirtualScroll
        items={Array.from({ length: count }, (_, i) => i)}
        itemSize={40}
        height={280}
        onScrollEnd={loadMore}
        renderItem={(i) => <Row i={i} suffix="h-10 · itemSize 40" />}
        className="rounded-xl border border-line bg-s2"
      />
      <Button onClick={loadMore}>Load 50 more manually ({count} total)</Button>
    </div>
  );
}

export const ScrollEndLoadMore: Story = {
  name: 'Scroll end — load more when the bottom is reached',
  render: () => <ScrollEndDemo />,
};

export const FixedHeightNote: Story = {
  name: 'Fixed itemSize only — dynamic row height not supported',
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-line bg-s3 p-3 text-body text-ink2">
        ⚠️ VirtualScroll is <strong className="text-ink">fixed-size</strong>: every row must respect{' '}
        <code className="text-accent">itemSize</code> (offset = first × itemSize). Variable-height
        rows (long wrapped text, images) need real measurement — keep content to one line or clamp
        it, like the truncated rows below.
      </div>
      <VirtualScroll
        items={Array.from({ length: 2000 }, (_, i) => `Row ${i} — clamped one-line content`)}
        itemSize={48}
        height={300}
        renderItem={(text) => (
          <div className="flex h-12 items-center border-b border-line2 px-4">
            <span className="truncate text-body text-ink2">{text}</span>
          </div>
        )}
        className="rounded-xl border border-line bg-s2"
      />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the scroll
 * viewport; `style` merges after the height inline style. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <VirtualScroll
      itemSize={44}
      height={240}
      items={Array.from({ length: 500 }, (_, i) => i)}
      renderItem={(n) => <div className="flex h-11 items-center px-3 text-body text-ink2">Virtual row {n + 1}</div>}
      classNames={{ root: 'rounded-xl border border-dashed border-accent' }}
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
    />
  ),
};
