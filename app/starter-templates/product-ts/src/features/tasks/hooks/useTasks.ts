// useTasks — query list + mutation toggle CÓ OPTIMISTIC UPDATE: UI đổi ngay,
// lỗi server → rollback về snapshot trước đó, xong luôn invalidate cho khớp.
// Pattern chuẩn TanStack Query (onMutate snapshot → onError rollback →
// onSettled re-sync). Refetch được expose để UI nối nút "Thử lại" khi list lỗi.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, tasksKeys } from '../api/tasks-api';
import { nextTaskStatus, type Task } from '../schema/schema';

/** Flag demo trên URL (?empty=1 / ?boom=1) → query params của GET list: rehearse
 * EmptyState/error UI ngay trên trình duyệt không cần đụng backend. Đọc TẠI LÚC
 * FETCH (không memo mount) — bỏ flag khỏi URL rồi bấm "Thử lại" là ăn ngay.
 * QueryKey vẫn `['tasks','list']` cố định để invalidate/toggle dùng chung. */
function demoListParams(): Record<string, string> | undefined {
  const search = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  if (search.has('empty')) params.empty = '1';
  if (search.has('boom')) params.boom = '1';
  return Object.keys(params).length > 0 ? params : undefined;
}

export function useTasks() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: tasksKeys.lists(), queryFn: () => tasksApi.list(demoListParams()) });

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

  return { query, toggle, refetch: query.refetch };
}
