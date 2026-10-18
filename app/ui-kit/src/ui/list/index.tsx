// List — antd List pattern: items + renderItem, loading → Skeleton, empty →
// EmptyState, pagination client-side (Pagination component sẵn), header/footer,
// bordered. a11y: role=list + listitem (ul/li). antd: divider giữa items mặc
// định, bordered = viền ngoài + nền s2, pagination góc phải dưới.
import { useState, type ReactNode } from 'react';
import { EmptyState } from '../empty-state/index';
import { Pagination } from '../pagination/index';
import { Skeleton } from '../skeleton/index';

export interface ListPaginationProps {
  pageSize: number;
}

export interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Skeleton 3 hàng thay toàn bộ nội dung. */
  loading?: boolean;
  /** Text khi items rỗng — render qua EmptyState. */
  emptyText?: string;
  /** false | { pageSize } — phân trang client-side (uncontrolled page). */
  pagination?: false | ListPaginationProps;
  header?: ReactNode;
  footer?: ReactNode;
  bordered?: boolean;
  /** Key React cho item (mặc định index). */
  rowKey?: (item: T, index: number) => string;
  className?: string;
}

export function List<T>({
  items,
  renderItem,
  loading = false,
  emptyText = 'Không có dữ liệu',
  pagination = false,
  header,
  footer,
  bordered = false,
  rowKey,
  className,
}: ListProps<T>) {
  const [page, setPage] = useState(1);
  const pageSize = pagination ? pagination.pageSize : items.length || 1;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const offset = (safePage - 1) * pageSize;
  const paged = pagination ? items.slice(offset, offset + pageSize) : items;

  const itemBorder = (isLast: boolean) =>
    !isLast || footer ? 'border-b border-line2' : '';

  return (
    <div
      className={`${bordered ? 'rounded-xl border border-line bg-s2' : ''}${className ? ` ${className}` : ''}`}
    >
      {header && (
        <div className="border-b border-line2 px-4 py-3 text-label font-semibold text-ink2">
          {header}
        </div>
      )}
      {loading ? (
        <div className="p-4">
          <Skeleton variant="row" count={3} />
        </div>
      ) : paged.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyText} />
        </div>
      ) : (
        <ul role="list" className="m-0 list-none p-0">
          {paged.map((item, i) => {
            const index = offset + i;
            return (
              <li
                key={rowKey ? rowKey(item, index) : index}
                role="listitem"
                className={`px-4 py-3 ${itemBorder(i === paged.length - 1)}`}
              >
                {renderItem(item, index)}
              </li>
            );
          })}
        </ul>
      )}
      {footer && (
        <div className="border-t border-line2 px-4 py-3 text-label text-ink3">
          {footer}
        </div>
      )}
      {pagination && !loading && items.length > 0 && (
        <div className="flex justify-end px-4 pb-4 pt-3">
          <Pagination
            current={safePage}
            pageSize={pageSize}
            total={items.length}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
