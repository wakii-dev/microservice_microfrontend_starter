// time-picker.stories.tsx — Forms/TimePicker (batch ⑧ worker C): input HH:mm +
// dropdown stepper tăng/giảm từng trường + nút nhanh "Bây giờ".
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimePicker } from './index.js';

const meta = {
  title: 'Forms/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Value nhận Date (onChange giữ nguyên phần ngày) hoặc string "HH:mm" (phát ngày thuần 01/01/1970). Panel: stepper ± từng trường Giờ/Phút (wrap 24h/60p) + nút nhanh Bây giờ. Locale qua prop hoặc DateLocaleProvider.',
      },
    },
  },
} satisfies Meta<typeof TimePicker>;
export default meta;

type Story = StoryObj<typeof meta>;

function CoBanDemo() {
  const [t, setT] = useState<Date | undefined>();
  return (
    <div className="grid w-[260px] gap-3">
      <TimePicker onChange={setT} />
      <p className="text-meta text-ink3">
        {t ? `Đã chọn: ${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}` : 'Mở panel → ± từng trường hoặc Bây giờ'}
      </p>
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic',
  render: () => <CoBanDemo />,
};

export const WithDateValue: Story = {
  name: 'With Date value — date part preserved',
  render: () => <TimePicker value={new Date(2026, 9, 18, 8, 30)} />,
};

/** StringValue — value as "HH:mm": trigger shows the time; a pick emits a pure
 * epoch-day Date (1970-01-01 + time) — pair with DatePicker, not standalone. */
export const StringValue: Story = {
  name: 'String value "08:30" — emits epoch-day Date',
  render: () => (
    <div className="grid w-[260px] gap-3">
      <TimePicker value="08:30" />
      <p className="text-meta text-ink3">String value → trigger renders HH:mm without a Date object.</p>
    </div>
  ),
};

export const LocaleEN: Story = {
  name: 'Locale EN',
  render: () => <TimePicker locale="en" />,
};

/** Disabled — trigger locked. */
export const Disabled: Story = {
  args: { disabled: true, value: '08:30' },
};

/** Controlled — string value 'HH:mm' demo. */
export const Controlled: Story = {
  render: () => <TimePickerControlledDemo />,
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <TimePicker />
    </div>
  ),
};

function TimePickerControlledDemo() {
  const [t, setT] = useState<string>('09:00');
  return (
    <div className="grid w-[260px] gap-3">
      <TimePicker value={t} onChange={(d) => setT(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`)} />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{t}</strong></p>
    </div>
  );
}
