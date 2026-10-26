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

// Specifier LITERAL (0.6.0 — BUG #4): './EditorInner.js' (khớp casing file thật —
// TS1149 nếu lệch) là entry tsup riêng (peer @tiptap/* chỉ nằm đó, không lọt vào
// index bundle). Trước đây qua BIẾN để né esbuild inline dynamic import
// (splitting:false) — nhưng khiến bundler consumer không phân tích được lazy split.
// Literal: TS suy type, vite dev prebundle + rollup consumer build đều resolve được;
// peer thiếu → build error RÕ. esbuild splitting:false sẽ inline EditorInner vào
// dist/editor.js (specifier không lọt dist — hết lo case-sensitivity).
// type qua import type (không kéo runtime)
import type { EditorInner as EditorInnerFn } from './EditorInner.js';
const EditorInner = lazy(() =>
  import('./EditorInner.js').then((m) => ({ default: m.EditorInner as typeof EditorInnerFn })),
);

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
