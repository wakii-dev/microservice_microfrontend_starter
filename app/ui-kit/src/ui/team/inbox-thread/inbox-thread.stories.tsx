// InboxThread stories — thread 2 phía lead/worker + quick-send controlled.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { InboxThread, type ThreadMessage } from './index';

const meta = { title: 'Domain/InboxThread', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

const NOW = Date.now();
const at = (min: number) => new Date(NOW - min * 60000);

/** Basic — góc nhìn worker: lead bubble phải (accent), mình trái. */
export const Basic: S = {
  render: () => (
    <InboxThread
      className="h-96 max-w-md"
      viewer="v1"
      messages={[
        { at: at(12), from: 'v1', to: 'lead', body: 'Responsive pre-pass xong — 6 template, 2 fix.', delivered: true },
        { at: at(8), from: 'lead', to: 'v1', body: 'ACK. Nhận queue Team-OS.', delivered: true },
        { at: at(1), from: 'v1', to: 'lead', body: 'PingFeed + StagePipeline xong — gửi report sau.' },
      ]}
    />
  ),
};

/** Controlled — useState ngoài: gửi → message append vào thread. */
export const Controlled: S = {
  name: 'Controlled — gửi tin live (useState)',
  render: () => <ControlledDemo />,
};

function ControlledDemo() {
  const [msgs, setMsgs] = useState<ThreadMessage[]>([
    { at: at(30), from: 'lead', to: 'v1', body: 'Brief: 5 comp Team-OS, tests ≥4.', delivered: true },
    { at: at(20), from: 'v1', to: 'lead', body: 'Đã hiểu — bắt đầu PingFeed.', delivered: true },
  ]);
  const [draft, setDraft] = useState('');
  return (
    <InboxThread
      className="h-96 max-w-md"
      viewer="v1"
      messages={msgs}
      value={draft}
      onChange={setDraft}
      onSend={(t) => {
        setMsgs((m) => [...m, { at: new Date(), from: 'v1', to: 'lead', body: t }]);
        setDraft('');
      }}
    />
  );
}

/** DarkTheme — bong bóng accent trên dark canvas. */
export const DarkTheme: S = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="p-3">
      <InboxThread
        className="h-80 max-w-md"
        viewer="lead"
        messages={[
          { at: at(15), from: 'lead', to: 'w7', body: 'Gate depth wave 2 — gửi số đo contrast.', delivered: true },
          { at: at(2), from: 'w7', to: 'lead', body: '4.7:1 body · 3.2:1 heading — vượt ngưỡng.' },
        ]}
      />
    </div>
  ),
};
