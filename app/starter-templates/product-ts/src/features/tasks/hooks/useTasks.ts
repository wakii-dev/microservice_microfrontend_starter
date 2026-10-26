// useTasks — query list + mutation toggle CÓ OPTIMISTIC UPDATE: UI đổi ngay,
// lỗi server → rollback về snapshot trước đó, xong luôn invalidate cho khớp.
// Pattern chuẩn TanStack Query (onMutate snapshot → onError rollback →
// onSettled re-sync).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, tasksKeys } from '../api/tasks-api';
import { nextTaskStatus, type Task } from '../schema/schema';

export function useTasks() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tasksKeys.lists(), queryFn: () => tasksApi.list() });

  const toggle = useMutation({
    mutationFn: (task: Task) => tasksApi.toggleStatus(task),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });
      const previous = queryClient.getQueryData<Task[]>(tasksKeys.lists());
      queryClient.setQueryData<Task[]>(tasksKeys.lists(), (old) =>
        old?.map((t) => (t.id === task.id ? { ...t, status: nextTaskStatus(task.status) } : t)),
      );
      return { previous };
    },
    onError: (_error, _task, context) => {
      // Server chối → trả lại đúng trạng thái user đã thấy trước khi bấm.
      if (context?.previous) queryClient.setQueryData(tasksKeys.lists(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
    },
  });

  return { query, toggle };
}
