// TasksPage — UI THUẦN (presentational): nhận data + callbacks qua props,
// KHÔNG tự fetch (container mới là bên nối data — pattern containers). State
// UI cục bộ (dòng đang confirm xoá) vẫn nằm đây — nó không phải data layer.
// 3 nhánh hiển thị: lỗi (Alert + Thử lại) → rỗng (EmptyState) → bảng thường.
import { useState } from 'react';
import {
  Alert,
  Button,
  EmptyState,
  Popconfirm,
  Table,
  Tag,
  Text,
  type TableColumn,
} from '@wakii/ui-kit';
import { TASK_STATUS_LABEL, type Task, type TaskStatus } from '../schema/schema';
import { TaskItem } from './TaskItem';

export interface TasksPageProps {
  tasks: Task[];
  loading?: boolean;
  /** Lỗi load list (nếu có) — hiện Alert thay bảng. */
  error?: string | null;
  /** Nút "Thử lại" trên Alert lỗi — container nối query.refetch vào đây. */
  onRetry?: () => void;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  deleting?: boolean;
}

const STATUS_TAG_CLS: Record<TaskStatus, string> = {
  todo: 'text-ink2',
  doing: 'text-st-doing',
  done: 'text-st-done',
};

export function TasksPage({
  tasks,
  loading = false,
  error,
  onRetry,
  onToggle,
  onDelete,
  deleting = false,
}: TasksPageProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert type="error" message="Không tải được danh sách task" description={error} />
        {onRetry && (
          <Button onClick={onRetry} disabled={loading}>
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  // Rỗng CHỈ khi đã load xong (loading xong, không lỗi) — đang pending thì để
  // Table tự chạy spinner, tránh nhấp nháy EmptyState trước data đầu tiên.
  if (!loading && tasks.length === 0) {
    return (
      <EmptyState
        title="Chưa có task nào"
        description="Thêm task đầu tiên bằng form phía trên — danh sách sẽ hiện ở đây."
      />
    );
  }

  const columns: TableColumn<Task>[] = [
    {
      key: 'task',
      title: 'Task',
      render: (row: Task) => <TaskItem task={row} onToggle={onToggle} />,
    },
    { key: 'assignee', title: 'Người thực hiện', render: (row: Task) => <Text type="secondary">{row.assignee ?? '—'}</Text> },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row: Task) => (
        <Tag className={STATUS_TAG_CLS[row.status]}>{TASK_STATUS_LABEL[row.status]}</Tag>
      ),
    },
    {
      key: 'actions',
      title: '',
      render: (row: Task) => (
        <Popconfirm
          open={confirmingId === row.id}
          title={`Xoá "${row.title}"?`}
          onConfirm={() => {
            onDelete(row);
            setConfirmingId(null);
          }}
          onCancel={() => setConfirmingId(null)}
          okText="Xoá"
          cancelText="Giữ"
        >
          <Button
            type="text"
            size="small"
            disabled={deleting}
            aria-label={`Xoá task ${row.title}`}
            onClick={() => setConfirmingId(row.id)}
          >
            Xoá
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} />
  );
}
