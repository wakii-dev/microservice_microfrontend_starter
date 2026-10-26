// DeferredContent stories — skeleton placeholder, swap on scroll into view.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeferredContent } from './index';

/** Lazy content swap — IntersectionObserver fires once on scroll into view. */
const meta = { title: 'Primitives/DeferredContent', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Basic — scroll this block into view: skeleton swaps to the loaded card once. */
export const Basic: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="h-40 rounded-xl border border-line bg-s2 p-4 text-body text-ink3">
        Scroll down ↓ — the deferred block loads when it enters the viewport.
      </div>
      <DeferredContent onVisible={() => console.log('[DeferredContent] visible')}>
        <div className="rounded-xl border border-line bg-s1 p-4">
          <p className="m-0 text-body text-ink">Loaded — chart, map or editor mounts only now.</p>
        </div>
      </DeferredContent>
      <div className="h-40" />
    </div>
  ),
};

/** CustomPlaceholder — own loading node instead of the default skeleton card. */
export const CustomPlaceholder: Story = {
  name: 'Custom placeholder',
  render: () => (
    <DeferredContent placeholder={<div className="rounded-xl border border-dashed border-line p-4 text-label text-ink3">Queueing task…</div>}>
      <div className="rounded-xl border border-line bg-s1 p-4">
        <p className="m-0 text-body text-ink">Custom content in place.</p>
      </div>
    </DeferredContent>
  ),
};

/** LoadOnInit — skips the observer; children mount immediately. */
export const LoadOnInit: Story = {
  name: 'LoadOnInit — no waiting',
  render: () => (
    <DeferredContent loadOnInit>
      <div className="rounded-xl border border-line bg-s1 p-4">
        <p className="m-0 text-body text-ink">Rendered right away — useful above the fold.</p>
      </div>
    </DeferredContent>
  ),
};

/** DarkTheme — placeholder bones follow tokens. */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="p-2">
      <DeferredContent>
        <div className="rounded-xl border border-line bg-s1 p-4">
          <p className="m-0 text-body text-ink">Dark content.</p>
        </div>
      </DeferredContent>
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the observed
 * wrapper div, `placeholder` on the default skeleton card; `style` lands on
 * the wrapper; the user's className always comes last. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <DeferredContent
      classNames={{
        root: 'rounded-xl',
        placeholder: 'border-dashed border-accent bg-accent/5',
      }}
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
      className="border border-line"
    >
      <div className="rounded-xl border border-line bg-s1 p-4">
        <p className="m-0 text-body text-ink">Slotted wrapper — placeholder styled while loading.</p>
      </div>
    </DeferredContent>
  ),
};
