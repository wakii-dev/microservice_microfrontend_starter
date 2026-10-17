// Table (lightweight) — columns + dataSource generic; header bg s3, row border-b
// line2, hover s3. KHÔNG sort/filter/virtual (backlog). render cell tuỳ ý.
import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  title: ReactNode;
  render?: (record: T, index: number) => ReactNode;
  /** width css (vd '25%'). */
  width?: string;
}

export interface TableProps<T> {
  columns: Array<TableColumn<T>>;
  dataSource: T[];
  /** key row — dùng row[key]. */
  rowKey: keyof T;
  className?: string;
}

export function Table<T extends object>({ columns, dataSource, rowKey, className }: TableProps<T>) {
  return (
    <table className={`w-full border-collapse overflow-hidden rounded-3 text-left text-body${className ? ` ${className}` : ''}`}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={col.width ? { width: col.width } : undefined}
              className="border-b border-line2 bg-s3 px-4 py-2 font-semibold text-ink2"
            >
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map((record, i) => (
          <tr key={String(record[rowKey])} className={`transition-colors hover:bg-s3 ${i % 2 === 1 ? 'bg-[rgba(0,0,0,0.02)]' : ''}`}>
            {columns.map((col) => (
              <td key={col.key} className="border-b border-line2 px-4 py-2 text-ink">
                {col.render ? col.render(record, i) : String((record as Record<string, unknown>)[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
        {dataSource.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="border-b border-line2 px-4 py-6 text-center text-ink3">
              Không có dữ liệu
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
