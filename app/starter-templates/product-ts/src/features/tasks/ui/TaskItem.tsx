// TaskItem — 1 hàng task: nút toggle trạng thái (icon mũi tên) + tiêu đề.
// Thuần props — toggle do container truyền xuống.
import { Button, Icon, Text } from '@wakii/ui-kit';
import { TASK_STATUS_LABEL, nextTaskStatus, type Task } from '../schema/schema';

export interface TaskItemProps {
  task: Task;
  onToggle: (task: Task) => void;
}

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const next = nextTaskStatus(task.status);
  return (
    <div className="flex items-center gap-2">
      <Button
        type="text"
        size="small"
        onClick={() => onToggle(task)}
        aria-label={`Đổi "${task.title}" sang ${TASK_STATUS_LABEL[next]}`}
        title={`Chuyển sang ${TASK_STATUS_LABEL[next]}`}
      >
        <Icon name="arrow-right" size={13} />
      </Button>
      <Text>{task.title}</Text>
    </div>
  );
}
