// TasksPageContainer — nối DATA với UI: useTasks (query + toggle optimistic),
// mutation xoá (useMutation + invalidate) rồi bơm props cho ui/TasksPage.
// Container là nơi DUY NHẤT của feature chạm hooks/api.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@wakii/ui-kit';
import { tasksApi, tasksKeys } from '../api/tasks-api';
import type { Task } from '../schema/schema';
import { useTasks } from '../hooks/useTasks';
import { TasksPage } from '../ui/TasksPage';

export function TasksPageContainer() {
  const queryClient = useQueryClient();
  const { query, toggle } = useTasks();

  const remove = useMutation({
    mutationFn: (task: Task) => tasksApi.remove(task.id),
    onSuccess: () => {
      message.success('Đã xoá task');
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
    onError: () => message.error('Xoá task thất bại — thử lại nhé'),
  });

  return (
    <TasksPage
      tasks={query.data ?? []}
      loading={query.isPending}
      error={query.isError ? (query.error instanceof Error ? query.error.message : String(query.error)) : null}
      onToggle={(task) => toggle.mutate(task)}
      onDelete={(task) => remove.mutate(task)}
      deleting={remove.isPending}
    />
  );
}
