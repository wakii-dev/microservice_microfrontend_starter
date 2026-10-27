// DemoAccess — thẻ tài khoản demo (giữ nguyên nội dung + contract test:
// alice@demo.local / fail@demo.local đọc được — shell-chrome.test). Chuyển từ
// HomePage cũ sang landing section, visual mới (code chip + saga hint).
// Redesign shell-kit (2026-10-27): reveal vào viewport bằng Reveal kit.
import { Card, Reveal, Tag } from '@wakii/ui-kit';

/** Tài khoản demo — nội dung GIỮ NGUYÊN (test đọc alice/fail@demo.local). */
export function DemoAccess() {
  return (
    <section aria-label="Demo accounts" className="pb-10">
      <Reveal direction="up" rootMargin="0px 0px -60px 0px">
        <Card className="text-label text-ink2">
        <p className="mb-2 flex items-center gap-2 text-meta uppercase tracking-[0.06em] text-ink3">
          Demo access
          <Tag>local only</Tag>
        </p>
        <ul className="m-0 flex flex-col gap-1 pl-4">
          <li>
            <code className="font-mono text-meta text-ink">alice@demo.local</code> /{' '}
            <code className="font-mono text-meta text-ink">demo-password</code> — main account
          </li>
          <li>
            <code className="font-mono text-meta text-ink">fail@demo.local</code> — assign a task to
            this user to watch the saga: badge <em>“Gán thất bại”</em>
          </li>
        </ul>
        </Card>
      </Reveal>
    </section>
  );
}
