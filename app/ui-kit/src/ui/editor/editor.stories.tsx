// Editor stories — CoBan (toolbar + content mẫu) / ControlledDemo (HTML realtime) /
// Placeholder. Tiptap v3 — jsdom-friendly qua commands, browser gõ trực tiếp.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './index';

const meta = { title: 'Forms/Editor', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

export const CoBan: S = {
  name: 'Cơ bản — toolbar + content mẫu',
  render: () => <Editor content="<p>Nội dung <strong>mẫu</strong> — thử toolbar bên trên.</p>" placeholder="Bắt đầu viết…" />,
};

export const ControlledDemo: S = {
  name: 'Controlled — HTML output realtime (useState)',
  render: () => {
    const [html, setHtml] = useState('<p>Gõ gì đó để thấy HTML…</p>');
    return (
      <div className="flex w-[560px] flex-col gap-3">
        <Editor content={html} onChange={setHtml} placeholder="Viết ghi chú…" />
        <pre className="m-0 max-h-32 overflow-auto rounded-lg border border-line bg-s1 p-3 text-meta text-ink2">
          {html}
        </pre>
      </div>
    );
  },
};

export const Placeholder: S = {
  name: 'Placeholder — hiện khi trống',
  render: () => <Editor placeholder="Nhập mô tả task tại đây…" className="max-w-[420px]" />,
};
