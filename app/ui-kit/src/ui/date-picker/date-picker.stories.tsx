// date-picker.stories.tsx — Forms/DatePicker: single (behavior cũ) + batch ⑧
// worker C: Range (2 input from/to + hover preview), Time (showTime + OK),
// LocaleEN (DateLocaleProvider context + prop locale="en").
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from './index';
import { DateLocaleProvider } from './locale';
import { TimePicker } from '../time-picker/index';

const meta = { title: 'Forms/DatePicker', component: DatePicker, tags: ['autodocs'] } satisfies Meta<typeof DatePicker>;
export default meta;
type S = StoryObj<typeof meta>;

const pad = (n: number) => n.toString().padStart(2, '0');
const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

export const Basic: S = { args: { placeholder: 'Pick a date…' } };
export const Disabled: S = { args: { disabled: true, placeholder: 'Disabled' } };

/** Controlled — useState demo: picked date shown below. */
export const Controlled: S = {
  render: () => {
    const [d, setD] = useState<Date | undefined>();
    return (
      <div className="grid max-w-[320px] gap-3">
        <DatePicker value={d} onChange={(x) => setD(x)} placeholder="Pick a date…" />
        <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{d ? d.toLocaleDateString('vi-VN') : '—'}</strong></p>
      </div>
    );
  },
};

function RangeDemo() {
  const [range, setRange] = useState<[Date, Date] | undefined>();
  return (
    <div className="grid w-[320px] gap-3">
      <DatePicker range onChange={setRange} />
      <p className="text-meta text-ink3">
        {range ? `${fmt(range[0])} → ${fmt(range[1])}` : 'Mở panel → click ngày bắt đầu → hover xem preview → click ngày kết thúc'}
      </p>
    </div>
  );
}

export const DatePickerRange: S = {
  name: 'Range — from → to, hover preview',
  render: () => <RangeDemo />,
};

function TimeDemo() {
  const [d, setD] = useState<Date | undefined>();
  return (
    <div className="grid w-[380px] gap-3">
      <DatePicker showTime onChange={setD} />
      <p className="text-meta text-ink3">
        {d ? `Đã chọn: ${fmt(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : 'Chọn ngày → chỉnh giờ cột phải → OK để đóng'}
      </p>
    </div>
  );
}

export const DatePickerTime: S = {
  name: 'With time — showTime + OK confirm',
  render: () => <TimeDemo />,
};

export const LocaleEN: S = {
  name: 'Locale EN — DateLocaleProvider + locale prop',
  render: () => (
    <div className="grid w-[380px] gap-4">
      <DateLocaleProvider locale="en">
        <DatePicker />
        <TimePicker />
      </DateLocaleProvider>
      <DatePicker locale="en" />
    </div>
  ),
};

export const DarkTheme: S = {
  name: 'DarkTheme — single + range + time',
  render: () => (
    <div data-bp-theme="dark" className="grid w-96 gap-3 rounded-xl bg-canvas p-4">
      <DatePicker />
      <DatePicker range />
      <TimePicker />
    </div>
  ),
};
