// Editor stories — Basic (toolbar + sample content) / Controlled (realtime HTML) /
// Placeholder. Tiptap v3 — jsdom-friendly via commands, direct typing in browser.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './index';

/** Rich-text editor (Tiptap) — toolbar + HTML output, subpath `@wakii/ui-kit/editor`. */
const meta = { title: 'Forms/Editor', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

export const Basic: S = {
  name: 'Basic — toolbar + sample content',
  render: () => <Editor content="<p>Sample <strong>content</strong> — try the toolbar above.</p>" placeholder="Start writing…" />,
};

function ControlledDemo() {
  const [html, setHtml] = useState('<p>Type to see the HTML…</p>');
  return (
    <div className="flex w-[560px] flex-col gap-3">
      <Editor content={html} onChange={setHtml} placeholder="Write a note…" />
      <pre className="m-0 max-h-32 overflow-auto rounded-lg border border-line bg-s1 p-3 text-meta text-ink2">
        {html}
      </pre>
    </div>
  );
}

export const Controlled: S = {
  name: 'Controlled — realtime HTML output (useState)',
  render: () => <ControlledDemo />,
};

export const Placeholder: S = {
  name: 'Placeholder — shown when empty',
  render: () => <Editor placeholder="Enter the task description…" className="max-w-[420px]" />,
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the bordered
 * card, `toolbar` on the sticky button strip, `content` on the ProseMirror
 * wrapper; `style` lands on the root card. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <Editor
      content="<p>Slotted editor — toolbar and content restyled.</p>"
      classNames={{
        root: 'border-accent/60 shadow-lift',
        toolbar: 'bg-accent/5',
        content: '[&_.ProseMirror]:bg-s1',
      }}
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
      className="max-w-[480px]"
    />
  ),
};
