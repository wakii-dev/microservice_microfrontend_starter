// PageHeader — tiêu đề trang + mô tả + slot actions (nút phải). Dùng cho mọi
// trang để đồng bộ nhịp dọc; trạng thái loading/từ khóa tìm kiếm thì page tự
// thêm bên dưới, không nhét vào đây.
import { Text, Title } from '@wakii/ui-kit';

/** props: title (bắt buộc) · description? (dòng phụ dưới title) ·
 * actions? (slot phải — nút chính/phụ của trang, vd "Tạo mới"). */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <Title level={2}>{title}</Title>
        {description ? (
          <div className="max-w-2xl">
            <Text type="secondary">{description}</Text>
          </div>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
