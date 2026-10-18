// Editor — PEER-DEP pattern (Tiptap v3): public wrapper lazy-import phần thân
// React qua React.lazy (hooks không gọi được sau import động kiểu cũ — stub cũ
// setReady(true) rồi render div RỖNG đã xoá). Import fail → ErrorBoundary render
// `fallback` (fallback KHÔNG chặn render khi engine có sẵn — pattern Chart mới).
// Thân thật nằm ở EditorInner.tsx (useEditor + EditorContent + toolbar).
import { Component, Suspense, lazy, type ReactNode } from 'react';

export interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Fallback khi Tiptap chưa cài (dynamic import fail). */
  fallback?: ReactNode;
  /** Truy cập imperative editor instance (Tiptap Editor) — cho test/consumer nâng cao. */
  editorRef?: (editor: unknown | null) => void;
}

class EditorErrorBoundary extends Component<{ fallback?: ReactNode; children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <>
          {this.props.fallback ?? (
            <p className="p-4 text-body text-ink3">Cài @tiptap/react @tiptap/starter-kit để dùng Editor.</p>
          )}
        </>
      );
    }
    return this.props.children;
  }
}

const EditorInner = lazy(() => import('./EditorInner.js').then((m) => ({ default: m.EditorInner })));

export function Editor(props: EditorProps) {
  return (
    <EditorErrorBoundary fallback={props.fallback}>
      <Suspense
        fallback={<div className={`p-6 text-body text-ink3${props.className ? ` ${props.className}` : ''}`}>Đang tải editor…</div>}
      >
        <EditorInner {...props} />
      </Suspense>
    </EditorErrorBoundary>
  );
}
