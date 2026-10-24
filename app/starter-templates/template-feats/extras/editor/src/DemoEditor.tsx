// Overlay EXTRA: editor — trang demo <Editor> qua subpath '@wakii/ui-kit/editor'
// (engine thêm route '/editor' + chèn deps bên dưới).
// ⚠️ PEER DEPS — CLI thêm vào dependencies khi chọn extra này:
//   "@tiptap/react": "^3.32.0",
//   "@tiptap/starter-kit": "^3.32.0"
// Editor lazy-import tiptap lúc runtime; thiếu → fallback message (kit style
// editor qua prose classes — không cần CSS import).
import { useState } from 'react';
import { Editor } from '@wakii/ui-kit/editor';
import { Text, Title } from '@wakii/ui-kit';

const INITIAL_HTML = '<p>Hello <strong>Wakii</strong>! This rich text editor is powered by Tiptap.</p>';

/** Route gợi ý cho engine: '/editor'. */
export function EditorDemo() {
  const [html, setHtml] = useState(INITIAL_HTML);

  return (
    <div className="flex flex-col gap-4">
      <Title level={2}>Editor</Title>
      <Text type="secondary">
        Tiptap rich text — bold/lists/heads via the starter kit; live HTML output below.
      </Text>
      <Editor content={INITIAL_HTML} onChange={setHtml} placeholder="Write something…" />
      <div className="flex flex-col gap-1">
        <Text type="secondary">Live HTML:</Text>
        <Text code>{html}</Text>
      </div>
    </div>
  );
}
