// EditorInner — thân thật Tiptap v3 (static import — chỉ được load qua React.lazy
// ở index.tsx sau khi consumer có @tiptap/*). Toolbar: B/I/S + H2/H3 + list +
// undo/redo; active state theo editor.isActive; placeholder DIY qua editor.isEmpty
// (StarterKit v3 KHÔNG kèm Placeholder — không thêm dep mới).
import { useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Icon } from '../icons/index.js';
import type { EditorProps } from './index.js';

interface TBtn {
  key: string;
  label: string;
  title: string;
  cls?: string;
  icon?: 'arrow-left' | 'arrow-right';
  run: (editor: Editor) => void;
  active?: (editor: Editor) => boolean;
}

const TOOLS: TBtn[] = [
  { key: 'bold', label: 'B', title: 'Đậm', cls: 'font-bold', run: (ed) => void ed.chain().focus().toggleBold().run(), active: (ed) => ed.isActive('bold') },
  { key: 'italic', label: 'I', title: 'Nghiêng', cls: 'italic', run: (ed) => void ed.chain().focus().toggleItalic().run(), active: (ed) => ed.isActive('italic') },
  { key: 'strike', label: 'S', title: 'Gạch ngang', cls: 'line-through', run: (ed) => void ed.chain().focus().toggleStrike().run(), active: (ed) => ed.isActive('strike') },
  { key: 'h2', label: 'H2', title: 'Tiêu đề 2', cls: 'font-semibold', run: (ed) => void ed.chain().focus().toggleHeading({ level: 2 }).run(), active: (ed) => ed.isActive('heading', { level: 2 }) },
  { key: 'h3', label: 'H3', title: 'Tiêu đề 3', cls: 'font-semibold', run: (ed) => void ed.chain().focus().toggleHeading({ level: 3 }).run(), active: (ed) => ed.isActive('heading', { level: 3 }) },
  { key: 'bullet', label: '••', title: 'Danh sách chấm', run: (ed) => void ed.chain().focus().toggleBulletList().run(), active: (ed) => ed.isActive('bulletList') },
  { key: 'ordered', label: '1.', title: 'Danh sách số', cls: 'text-[11px]', run: (ed) => void ed.chain().focus().toggleOrderedList().run(), active: (ed) => ed.isActive('orderedList') },
  { key: 'undo', label: '', title: 'Hoàn tác', icon: 'arrow-left', run: (ed) => void ed.chain().focus().undo().run() },
  { key: 'redo', label: '', title: 'Làm lại', icon: 'arrow-right', run: (ed) => void ed.chain().focus().redo().run() },
];

export function EditorInner({ content = '', onChange, placeholder, className, editorRef }: EditorProps) {
  const [empty, setEmpty] = useState(!content);

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    // active state (B/I/S…) cần re-render theo selection/transaction — v3 mặc định off
    shouldRerenderOnTransaction: true,
    onCreate: ({ editor: ed }) => {
      editorRef?.(ed);
      setEmpty(ed.isEmpty);
    },
    onUpdate: ({ editor: ed }) => {
      setEmpty(ed.isEmpty);
      onChange?.(ed.getHTML());
    },
    onSelectionUpdate: ({ editor: ed }) => setEmpty(ed.isEmpty),
  });

  return (
    <div
      className={`overflow-hidden rounded-lg border border-line bg-s2 transition-colors focus-within:border-accent-hi${
        className ? ` ${className}` : ''
      }`}
    >
      {/* Toolbar sticky trên content */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-s1 px-1 py-1">
        {TOOLS.map((t) => {
          const active = editor ? Boolean(t.active?.(editor)) : false;
          return (
            <button
              key={t.key}
              type="button"
              aria-label={t.title}
              aria-pressed={active ? 'true' : 'false'}
              title={t.title}
              disabled={!editor}
              onClick={() => editor && t.run(editor)}
              className={`grid size-7 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-body text-ink2 transition-colors hover:bg-s3 hover:text-ink disabled:cursor-default disabled:opacity-50 ${
                active ? 'bg-s3 text-ink' : ''
              }`}
            >
              {t.icon ? <Icon name={t.icon} size={14} /> : <span className={t.cls}>{t.label}</span>}
            </button>
          );
        })}
      </div>
      <div className="relative">
        {placeholder && empty && (
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-3 select-none text-body text-ink4">
            {placeholder}
          </span>
        )}
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:p-3 [&_.ProseMirror]:text-body [&_.ProseMirror]:text-ink [&_.ProseMirror]:outline-none"
        />
      </div>
    </div>
  );
}
