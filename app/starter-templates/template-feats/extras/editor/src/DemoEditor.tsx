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

/** Pretty-print HTML cho panel output — thẻ block xuống dòng + thụt lề 2 space. */
function formatHtml(html: string): string {
  const parts = html.replace(/>\s*</g, '>\n<').split('\n');
  let depth = 0;
  return parts
    .map((part) => {
      if (part.startsWith('</')) depth = Math.max(0, depth - 1);
      const line = `${'  '.repeat(depth)}${part}`;
      const opensBlock = /^<[a-z][^/>]*>$/i.test(part) && !/^<(code|strong|em|b|i)>$/i.test(part);
      if (opensBlock) depth += 1;
      return line;
    })
    .join('\n');
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
