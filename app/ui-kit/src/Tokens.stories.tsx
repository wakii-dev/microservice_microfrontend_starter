// Docs sống cho design tokens (nguồn sự thật: src/styles/tokens.css — direction B
// "Linear-referenced dark"). Swatch đọc var(--*) TRỰC TIẾP — đổi token là trang này
// đổi theo, không có bản copy để drift.
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Design Tokens',
  tags: ['!dev'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

function Swatches({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 'var(--fs-h1)', color: 'var(--ink)', margin: '0 0 12px' }}>{title}</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {items.map(([name, value]) => (
          <div key={name} style={{ width: 132 }}>
            <div
              style={{
                height: 44,
                borderRadius: 'var(--r-2)',
                border: '1px solid var(--line)',
                background: `var(${name})`,
              }}
            />
            <code style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink2)' }}>{name}</code>
            <div style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink3)' }}>{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Scales({ title, items, style }: { title: string; items: Array<[string, string]>; style: (v: string) => CSSProperties }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 'var(--fs-h1)', color: 'var(--ink)', margin: '0 0 12px' }}>{title}</h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
        {items.map(([name, value]) => (
          <div key={name}>
            <div style={style(`var(${name})`)} />
            <code style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink2)' }}>{name}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

export const BềMặt: Story = {
  name: 'Bề mặt + mực + viền',
  render: () => (
    <div style={{ padding: 24, background: 'var(--c-canvas)', minHeight: '100vh' }}>
      <Swatches
        title="Surface (depth bằng bậc bề mặt — KHÔNG box-shadow)"
        items={[
          ['--c-canvas', '#010102'],
          ['--c-s1', '#0f1011'],
          ['--c-s2', '#141516'],
          ['--c-s3', '#18191a'],
        ]}
      />
      <Swatches
        title="Mực (text)"
        items={[
          ['--ink', '#f7f8f8'],
          ['--ink2', '#d0d6e0'],
          ['--ink3', '#8a8f98 — chỉ meta ≥12px'],
        ]}
      />
      <Swatches
        title="Viền + accent duy nhất"
        items={[
          ['--line', '#23252a'],
          ['--line2', '#2b2d33'],
          ['--accent', '#5e6ad2'],
          ['--accent-hi', '#828fff'],
        ]}
      />
      <Swatches
        title="Trạng thái task"
        items={[
          ['--st-todo', '#8a8f98'],
          ['--st-doing', '#f2c94c'],
          ['--st-done', '#3fb950'],
          ['--st-fail', '#f06a6a'],
        ]}
      />
      <Scales
        title="Radius"
        items={[
          ['--r-1', '4px'],
          ['--r-2', '6px'],
          ['--r-3', '8px'],
          ['--r-pill', '9999px'],
        ]}
        style={(v) => ({ width: 56, height: 32, background: 'var(--c-s3)', border: '1px solid var(--line)', borderRadius: v })}
      />
      <Scales
        title="Spacing (4base)"
        items={[
          ['--sp-1', '4px'],
          ['--sp-2', '8px'],
          ['--sp-3', '12px'],
          ['--sp-4', '16px'],
          ['--sp-5', '24px'],
          ['--sp-6', '32px'],
        ]}
        style={(v) => ({ width: v, height: 16, background: 'var(--accent)' })}
      />
      <Scales
        title="Type scale"
        items={[
          ['--fs-meta', '12px'],
          ['--fs-label', '13px'],
          ['--fs-body', '14px'],
          ['--fs-h2', '16px'],
          ['--fs-h1', '18px'],
        ]}
        style={(v) => ({ fontSize: v, color: 'var(--ink)', fontFamily: 'var(--f)' })}
      />
    </div>
  ),
};
