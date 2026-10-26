// QRCode stories — antd parity (docs/parity-matrix.md Gap P1).
// Matrix: basic · with-size · error-levels · value-change demo · dark theme (tokens).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Icon, QRCode } from '../../index';

const meta = {
  title: 'Data Display/QRCode',
  component: QRCode,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'number' },
    errorLevel: { control: 'select', options: ['L', 'M', 'Q', 'H'] },
    value: { control: 'text' },
  },
} satisfies Meta<typeof QRCode>;
export default meta;

type Story = StoryObj<typeof meta>;

/** Basic — default size 160, errorLevel M, token colors (fg ink / bg s1). */
export const Basic: Story = {
  args: { value: 'https://demo.local/tasks/42' },
};

/** WithSize — 64 / 96 / 160 / 240 px on one row. */
export const WithSize: Story = {
  args: { value: 'https://demo.local' },
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {[64, 96, 160, 240].map((s) => (
        <figure key={s} className="grid gap-2">
          <QRCode value="https://demo.local" size={s} />
          <figcaption className="text-center text-label text-ink3">{s}px</figcaption>
        </figure>
      ))}
    </div>
  ),
};

/** ErrorLevels — same value encoded at L / M / Q / H (higher level = denser matrix). */
export const ErrorLevels: Story = {
  args: { value: 'https://demo.local' },
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
        <figure key={lvl} className="grid gap-2">
          <QRCode value="https://demo.local" errorLevel={lvl} size={120} />
          <figcaption className="text-center text-label text-ink3">
            level {lvl}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

/** ValueChange — type any text (Vietnamese included); the matrix re-encodes live. */
export const ValueChange: Story = {
  args: { value: 'https://demo.local' },
  render: () => <ValueChangeDemo />,
};

function ValueChangeDemo() {
  const [value, setValue] = useState('https://demo.local/pay/abc?amount=250000');
  return (
    <div className="flex items-start gap-6">
      <QRCode value={value} size={180} />
      <label className="grid gap-2 text-label text-ink2">
        Encoded value
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="w-72 rounded-lg border border-line bg-s2 px-3 py-2 text-body text-ink outline-none focus:border-accent-hi"
        />
        <span className="text-ink3">{value.length} chars → auto version pick</span>
      </label>
    </div>
  );
}

/** WithIcon — antd excavate mode: white punch-out frame + centered icon; error level auto-raises to H (or pass your own). */
export const WithIcon: Story = {
  args: { value: 'https://demo.local' },
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      <figure className="grid gap-2">
        <QRCode value="https://demo.local/pay/abc" size={140} icon={<Icon name="star" size={22} className="text-ink" />} />
        <figcaption className="text-center text-label text-ink3">auto level H</figcaption>
      </figure>
      <figure className="grid gap-2">
        <QRCode value="https://demo.local/pay/abc" size={140} errorLevel="Q" icon={<span className="text-body font-bold">₫</span>} />
        <figcaption className="text-center text-label text-ink3">explicit level Q</figcaption>
      </figure>
    </div>
  ),
};

/** CustomColors — override via props (defaults are tokens: ink on s1). */
export const CustomColors: Story = {
  args: { value: 'https://demo.local' },
  render: () => (
    <div className="flex flex-wrap gap-6">
      <QRCode value="https://demo.local" bgColor="var(--accent)" fgColor="var(--c-s1)" size={120} />
      <QRCode value="https://demo.local" bgColor="var(--ink)" fgColor="var(--c-s1)" size={120} />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` on the wrapper span,
 * `code` on the svg, `icon` on the center punch-out; `style` lands on root. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  args: {
    value: 'https://wakii.dev/pay/42',
    size: 180,
    classNames: { root: 'rounded-xl border border-dashed border-accent p-2', icon: 'rounded-full' },
    style: { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' },
    icon: <span className="text-h3 font-bold">W</span>,
  },
};
