// TasksPage — UI THUẦN (presentational): nhận data + callbacks qua props,
// KHÔNG tự fetch (container mới là bên nối data — pattern containers). State
// UI cục bộ (dòng đang confirm xoá) vẫn nằm đây — nó không phải data layer.
import { useState } from 'react';
import {
  Alert,
  Button,
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
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  deleting?: boolean;
}

const STATUS_TAG_CLS: Record<TaskStatus, string> = {
  todo: 'text-ink2',
  doing: 'text-st-doing',
  done: 'text-st-done',
};

export function TasksPage({ tasks, loading = false, error, onToggle, onDelete, deleting = false }: TasksPageProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  if (error) {
    return <Alert type="error" message="Không tải được danh sách task" description={error} />;
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
