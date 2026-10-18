// SplitButton stories — batch ⑱: CoBan / WithIcons+separator / DangerItem / demo.
// Unity shell 2026-10-18: thêm UnityTones (4 tông cạnh nhau) + Sizes — soát mắt
// "1 thể thống nhất" (1 border wrapper, vạch phân cách nội bộ, không seam).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitButton } from './index';
import { Icon } from '../icons/index';

// Không set component (label/items required → story buộc args) — render-only
// stories, cùng pattern pagination/carousel.
const meta = { title: 'Navigation/SplitButton', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  name: 'Cơ bản — action chính + dropdown',
  render: () => (
    <SplitButton
      label="Lưu task"
      items={[
        { key: 'save-run', label: 'Lưu + chạy' },
        { key: 'save-draft', label: 'Lưu nháp' },
      ]}
      onClick={() => console.log('save')}
      onItemClick={(key) => console.log('item:', key)}
    />
  ),
};

export const WithIcons: Story = {
  name: 'WithIcons — icon từng item + separator',
  render: () => (
    <SplitButton
      label="Xuất báo cáo"
      items={[
        { key: 'pdf', label: 'Xuất PDF', icon: <Icon name="download" size={14} /> },
        { key: 'csv', label: 'Xuất CSV', icon: <Icon name="download" size={14} /> },
        { key: 'sep', label: '', separator: true },
        { key: 'print', label: 'In', icon: <Icon name="copy" size={14} /> },
      ]}
      onItemClick={(key) => console.log('export:', key)}
    />
  ),
};

/** UnityTones — 4 tông cạnh nhau để soát mắt khối liên tục: primary (border-accent
 * + divider trắng mờ), default (border-line + divider line), text ghost, danger
 * solid (border-st-fail). Mở menu từng cái xem hover overlay không vỡ nền. */
export const UnityTones: Story = {
  name: 'Unity — 4 tông liền khối (primary/default/text/danger)',
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
      <SplitButton
        label="Lưu task"
        items={[
          { key: 'save-run', label: 'Lưu + chạy' },
          { key: 'save-draft', label: 'Lưu nháp' },
        ]}
      />
      <SplitButton
        type="default"
        label="Lưu task"
        items={[
          { key: 'save-run', label: 'Lưu + chạy' },
          { key: 'save-draft', label: 'Lưu nháp' },
        ]}
      />
      <SplitButton
        type="text"
        label="Lưu task"
        items={[
          { key: 'save-run', label: 'Lưu + chạy' },
          { key: 'save-draft', label: 'Lưu nháp' },
        ]}
      />
      <SplitButton
        danger
        label="Xoá dữ liệu"
        items={[
          { key: 'soft', label: 'Xoá mềm (archive)' },
          { key: 'sep', label: '', separator: true },
          { key: 'hard', label: 'Xoá vĩnh viễn', danger: true },
        ]}
      />
    </div>
  ),
};

/** Sizes — small h-8 / middle h-9 (mặc định) / large h-10, đồng bộ Button. */
export const Sizes: Story = {
  name: 'Sizes (h-8 / h-9 / h-10)',
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      {(['small', 'middle', 'large'] as const).map((s) => (
        <div key={s} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 48, fontSize: 12, opacity: 0.6 }}>{s}</span>
          <SplitButton
            size={s}
            label="Lưu task"
            items={[{ key: 'save-draft', label: 'Lưu nháp' }]}
          />
          <SplitButton
            size={s}
            type="default"
            label="Xuất"
            items={[{ key: 'csv', label: 'Xuất CSV', icon: <Icon name="download" size={14} /> }]}
          />
        </div>
      ))}
    </div>
  ),
};

export const DangerItem: Story = {
  name: 'Danger — item xoá đỏ',
  render: () => (
    <SplitButton
      label="Xoá dữ liệu"
      danger
      items={[
        { key: 'soft', label: 'Xoá mềm (archive)' },
        { key: 'sep', label: '', separator: true },
        { key: 'hard', label: 'Xoá vĩnh viễn', danger: true },
      ]}
      onItemClick={(key) => console.log('delete:', key)}
    />
  ),
};

export const DemoChon: Story = {
  name: 'Demo — hiển thị key đã chọn (useState)',
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    const push = (msg: string) => setSelected((prev) => [...prev.slice(-2), msg]);
    return (
      <div className="flex flex-col gap-3">
        <ul className="m-0 list-none p-0 text-meta text-ink2">
          {selected.length === 0 ? <li>Chưa có hành động nào.</li> : selected.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
        <SplitButton
          label="Lưu task"
          items={[
            { key: 'save-run', label: 'Lưu + chạy', icon: <Icon name="check-circle" size={14} /> },
            { key: 'sep', label: '', separator: true },
            { key: 'save-draft', label: 'Lưu nháp', icon: <Icon name="pencil" size={14} /> },
          ]}
          onClick={() => push('click: Lưu task')}
          onItemClick={(key) => push(`item: ${key}`)}
        />
      </div>
    );
  },
};
