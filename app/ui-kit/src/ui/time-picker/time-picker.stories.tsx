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

export const TimePickerCoBan: Story = {
  name: 'TimePicker cơ bản',
  render: () => <CoBanDemo />,
};

export const TimePickerGiaTriDate: Story = {
  name: 'TimePicker value Date (giữ phần ngày)',
  render: () => <TimePicker value={new Date(2026, 9, 18, 8, 30)} />,
};

export const TimePickerLocaleEN: Story = {
  name: 'TimePicker locale EN',
  render: () => <TimePicker locale="en" />,
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <TimePicker />
    </div>
  ),
};
