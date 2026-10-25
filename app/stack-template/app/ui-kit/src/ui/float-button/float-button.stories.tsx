// FloatButton stories — single FAB, Group (hover/click), BackTop on a tall page.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../icons/index';
import { FloatButton, FloatButtonBackTop, FloatButtonGroup } from './index';

/** Floating action button — antd FloatButton lite, fixed bottom-right. */
const meta = { title: 'Navigation/FloatButton', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Basic — single button with tooltip (hover for the title bubble). */
export const Basic: Story = {
  render: () => (
    <div className="relative h-24 overflow-hidden rounded-xl border border-line bg-canvas">
      <FloatButton icon={<Icon name="pencil" size={16} />} tooltip="Soạn thảo" />
    </div>
  ),
};

/** Group — hover the trigger to fan out quick actions. */
export const Group: Story = {
  render: () => (
    <div className="relative h-40 overflow-hidden rounded-xl border border-line bg-canvas">
      <FloatButtonGroup ariaLabel="Thao tác nhanh">
        <FloatButton icon={<Icon name="pencil" size={16} />} tooltip="Soạn thảo" />
        <FloatButton icon={<Icon name="upload" size={16} />} tooltip="Tải lên" />
        <FloatButton icon={<Icon name="download" size={16} />} tooltip="Tải xuống" />
      </FloatButtonGroup>
    </div>
  ),
};

/** GroupClick — trigger=click keeps the cluster open until toggled. */
export const GroupClick: Story = {
  name: 'Group — click trigger',
  render: () => (
    <div className="relative h-40 overflow-hidden rounded-xl border border-line bg-canvas">
      <FloatButtonGroup trigger="click" ariaLabel="Thao tác nhanh">
        <FloatButton icon={<Icon name="file" size={16} />} tooltip="Tạo file" />
        <FloatButton icon={<Icon name="folder" size={16} />} tooltip="Tạo thư mục" />
      </FloatButtonGroup>
    </div>
  ),
};

/** BackTop — scroll the page (button below): the pill appears past 400px, click returns to top. */
export const BackTop: Story = {
  render: () => (
    <div>
      <p className="text-label text-ink3">Scroll the page (or click the button) — the pill appears past 400px.</p>
      <div className="my-3">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
          className="cursor-pointer rounded-lg border border-line bg-s2 px-3 py-1.5 text-body text-ink hover:bg-s3"
        >
          Scroll down ↓
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-s2 p-3 text-body text-ink2">
            Filler block {i + 1}
          </div>
        ))}
      </div>
      <FloatButtonBackTop visibilityHeight={400} />
    </div>
  ),
};

/** DarkTheme — buttons follow tokens on dark canvas (open via hover). */
export const DarkTheme: Story = {
  render: () => (
    <div data-bp-theme="dark" className="relative h-40 overflow-hidden rounded-xl bg-canvas">
      <FloatButton icon={<Icon name="pencil" size={16} />} tooltip="Soạn thảo" />
      <FloatButtonGroup icon={<Icon name="plus" size={20} />} ariaLabel="Thao tác nhanh">
        <FloatButton icon={<Icon name="upload" size={16} />} tooltip="Tải lên" />
      </FloatButtonGroup>
    </div>
  ),
};
