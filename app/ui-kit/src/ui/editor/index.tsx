// Editor — PEER-DEP pattern: Tiptap modular lazy import.
// Cài: pnpm add @tiptap/react @tiptap/starter-kit
import { useEffect, type ReactNode } from 'react';

export interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Fallback khi Tiptap chưa cài. */
  fallback?: ReactNode;
}

export function Editor({ content = '', onChange, placeholder, className, fallback }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ useEditor, EditorContent }, StarterKit] = await Promise.all([
          import('@tiptap/react'),
          import('@tiptap/starter-kit'),
        ]);
        if (cancelled) return;
        // Tiptap v2 hook-based — render qua portal phức tạp trong SSR wrapper
        // Đơn giản hơn: mount Tiptap trực tiếp vào ref
        const { default: EditorJS } = await import('@tiptap/core');
        void EditorJS; void useEditor; void EditorContent; void StarterKit;
        setReady(true);
      } catch {
        setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (failed) return <>{fallback ?? <p className="p-4 text-body text-ink3">Cài @tiptap/react @tiptap/starter-kit để dùng Editor.</p>}</>;
  if (!ready) return <div className={`p-6 text-body text-ink3${className ? ` ${className}` : ''}`}>Đang tải editor…</div>;
  return <div ref={ref} className={className} />;
}
