// Overlay EXTRA: editor — trang demo <Editor> qua subpath '@wakii/ui-kit/editor'.
// ⚠️ PEER DEPS: "@tiptap/react" + "@tiptap/starter-kit" ^3 (kit lazy-import).
// Redesign 2026-10-25: editor bên trái + panel output live (HTML + word count +
// marks) bên phải, nội dung khởi tạo dạng release notes.
import { useState } from 'react';
import { Editor } from '@wakii/ui-kit/editor';
import { Card, Statistic, Tag, Text, Title } from '@wakii/ui-kit';

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

const INITIAL_HTML = [
  '<h2>Release notes — 0.5.0</h2>',
  '<p>The kit ships <strong>90+ components</strong> with <em>tokens-first</em> theming.</p>',
  '<ul><li>Dark mode via <code>data-bp-theme</code></li><li>Motion recipes built in</li><li>Chart, Carousel, Schedule &amp; Editor subpaths</li></ul>',
  '<blockquote>Try editing me — the panel on the right updates live.</blockquote>',
].join('');

const MARKS = ['heading', 'bold', 'italic', 'code', 'lists', 'blockquote'];

function wordCount(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Pretty-print HTML cho panel output — block element xuống dòng + thụt lề 2
 * space; element chỉ chứa text/inline (p, li…) gộp MỘT dòng (inline không bẻ). */
const BLOCK_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'blockquote', 'div', 'pre']);

function serialize(el: Element, depth: number, out: string[]): void {
  const tag = el.tagName.toLowerCase();
  const attrs = Array.from(el.attributes)
    .map((a) => ` ${a.name}="${a.value}"`)
    .join('');
  const open = `<${tag}${attrs}>`;
  const hasBlockChild = Array.from(el.children).some((c) => BLOCK_TAGS.has(c.tagName.toLowerCase()));
  if (!hasBlockChild) {
    const inner = el.innerHTML.replace(/\s+/g, ' ').trim();
    out.push(`${'  '.repeat(depth)}${open}${inner}</${tag}>`);
    return;
  }
  out.push(`${'  '.repeat(depth)}${open}`);
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = (child.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (t) out.push(`${'  '.repeat(depth + 1)}${t}`);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      serialize(child as Element, depth + 1, out);
    }
  }
  out.push(`${'  '.repeat(depth)}</${tag}>`);
}

function formatHtml(html: string): string {
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
  const out: string[] = [];
  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) serialize(child as Element, 0, out);
    else {
      const t = (child.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (t) out.push(t);
    }
  }
  return out.join('\n');
}

/** Route gợi ý cho engine: '/editor'. */
export function EditorDemo() {
  const [html, setHtml] = useState(INITIAL_HTML);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className={EYEBROW}>Extra · tiptap</span>
        <Title level={1}>Rich text, zero config</Title>
        <div className="max-w-2xl">
          <Text type="secondary">
            Tiptap wrapped by the kit — headings, inline marks, lists and quotes via the starter kit. The output
            panel mirrors your edits as HTML in real time.
          </Text>
        </div>
      </div>

      {/* WYSIWYG 60% / Live output 40% */}
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Card title="WYSIWYG" extra={<Tag>subpath</Tag>}>
          <Editor content={INITIAL_HTML} onChange={setHtml} placeholder="Write something…" />
        </Card>
        <div className="flex flex-col gap-4">
          <Card title="Live output">
            <div className="flex flex-col gap-3">
              <Statistic title="Words" value={wordCount(html)} />
              <div className="flex flex-wrap gap-1.5">
                {MARKS.map((m) => (
                  <Tag key={m}>{m}</Tag>
                ))}
              </div>
            </div>
          </Card>
          <Card title="HTML">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all text-label text-ink2">
              {formatHtml(html)}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
