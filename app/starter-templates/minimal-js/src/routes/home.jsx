// Home — trang trắng chuẩn cấu trúc: PageHeader + chỗ đặt nội dung của bạn.
// Không data layer (preset minimal) — mọi fetch/state xài chung viết ở
// src/shared/ hoặc tách component trong src/routes/<tên>/ khi phình to.
import { PageHeader } from '@/shared/ui/PageHeader';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Chào mừng đến với {{appName}}"
        description="Trang trắng — bắt đầu dựng UI của bạn với @wakii/ui-kit. Xem AGENTS.md cho luật kiến trúc và quy ước đặt tên."
      />
      <section className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
        <p className="text-body text-ink3">Đặt nội dung trang chủ tại đây.</p>
      </section>
    </div>
  );
}
