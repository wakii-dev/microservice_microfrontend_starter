// Docs sống cho design tokens — LIGHT DEFAULT theo visual language antd (decision
// 2026-10-17: docs/superpowers/specs/2026-10-17-antd-look-tokens.md). Swatch đọc
// var(--*) TRỰC TIẾP — đổi token là trang này đổi theo, không có bản copy để drift.
// Story "Dark (direction B)" wrap data-bp-theme='dark' — xem palette archive.
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Theming & Motion/Design Tokens',
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

function Scales({
  title,
  items,
  style,
}: {
  title: string;
  items: Array<[string, string]>;
  style: (v: string) => CSSProperties;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 'var(--fs-h1)', color: 'var(--ink)', margin: '0 0 12px' }}>{title}</h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'baseline' }}>
        {items.map(([name]) => (
          <div key={name}>
            <div style={style(`var(${name})`)} />
            <code style={{ fontSize: 'var(--fs-meta)', color: 'var(--ink2)' }}>{name}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

const LIGHT = 'antd default (light)';

export const SángMặcĐịnh: Story = {
  name: `Light — ${LIGHT}`,
  render: () => (
    <div style={{ padding: 24, background: 'var(--c-canvas)', minHeight: '100vh' }}>
      <Swatches
        title="Surface (antd: layout gray + container white)"
        items={[
          ['--c-canvas', '#f5f5f5'],
          ['--c-s1', '#ffffff'],
          ['--c-s2', '#ffffff'],
          ['--c-s3', '#fafafa'],
        ]}
      />
      <Swatches
        title="Mực (colorText .88/.65/.45)"
        items={[
          ['--ink', 'rgba(0,0,0,.88)'],
          ['--ink2', 'rgba(0,0,0,.65)'],
          ['--ink3', 'rgba(0,0,0,.45) — chỉ meta ≥12px'],
        ]}
      />
      <Swatches
        title="Viền + accent (colorPrimary)"
        items={[
          ['--line', '#d9d9d9'],
          ['--line2', '#f0f0f0'],
          ['--accent', '#1677ff'],
          ['--accent-hi', '#4096ff'],
        ]}
      />
      <Swatches
        title="Trạng thái task (map antd palette)"
        items={[
          ['--st-todo', '#bfbfbf'],
          ['--st-doing', '#faad14'],
          ['--st-done', '#52c41a'],
          ['--st-fail', '#ff4d4f'],
        ]}
      />
      <Scales
        title="Radius"
        items={[
          ['--r-1', '4px'],
          ['--r-2', '6px (antd default)'],
          ['--r-3', '8px (LG)'],
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
        title="Type scale (antd base 14)"
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

export const TốiDirectionB: Story = {
  name: 'Dark — direction B (archive VU-53)',
  render: () => (
    <div data-bp-theme="dark" style={{ padding: 24, background: 'var(--c-canvas)', minHeight: '100vh' }}>
      <Swatches
        title="Surface — Linear-referenced dark"
        items={[
          ['--c-canvas', '#010102'],
          ['--c-s1', '#0f1011'],
          ['--c-s2', '#141516'],
          ['--c-s3', '#18191a'],
        ]}
      />
      <Swatches
        title="Accent — Florentine indigo"
        items={[
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
      <Swatches
        title="Mực phụ + disabled (mirror antd dark quaternary)"
        items={[
          ['--ink4', '#5c626b'],
          ['--bg-disabled', 'rgba(255,255,255,.04)'],
        ]}
      />
      <Swatches
        title="Alert tints — alpha màu trạng thái trên nền tối (bg 12% / border 37%)"
        items={[
          ['--alert-error-bg', 'rgba(240,106,106,.12)'],
          ['--alert-error-border', 'rgba(240,106,106,.37)'],
          ['--alert-warning-bg', 'rgba(242,201,76,.12)'],
          ['--alert-warning-border', 'rgba(242,201,76,.37)'],
          ['--alert-info-bg', 'rgba(94,106,210,.12)'],
          ['--alert-info-border', 'rgba(94,106,210,.37)'],
          ['--alert-success-bg', 'rgba(63,185,80,.12)'],
          ['--alert-success-border', 'rgba(63,185,80,.37)'],
        ]}
      />
    </div>
  ),
};
