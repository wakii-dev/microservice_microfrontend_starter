import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from './index';
const meta = { title: 'Forms/Calendar', component: Calendar, tags: ['autodocs'] } satisfies Meta<typeof Calendar>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — current month, no selection. */
export const Basic: S = {};

/** Controlled — useState demo: click a day → selected + shown below. */
export const Controlled: S = {
  render: () => {
    const [d, setD] = useState<Date | undefined>();
    return (
      <div className="grid max-w-[320px] gap-3">
        <Calendar value={d} onChange={setD} />
        <p className="m-0 font-mono text-meta text-ink3">
          value: <strong className="text-ink">{d ? d.toLocaleDateString('vi-VN') : '—'}</strong>
        </p>
      </div>
    );
  },
};

/** LocaleEN — English weekday/month labels. */
export const LocaleEN: S = {
  name: 'Locale EN',
  args: { locale: 'en' },
};

/** DarkTheme — month grid on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-[320px] rounded-xl bg-canvas p-4">
      <Calendar />
    </div>
  ),
};
