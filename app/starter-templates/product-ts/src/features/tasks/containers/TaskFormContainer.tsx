// TaskFormContainer — nối useTaskForm (form state + zod) với mutation create:
// submit pass schema → POST → invalidate list → reset form + toast.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@wakii/ui-kit';
import { tasksApi, tasksKeys } from '../api/tasks-api';
import { useTaskForm } from '../hooks/useTaskForm';
import { TaskForm } from '../ui/TaskForm';

export function TaskFormContainer() {
  const form = useTaskForm();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (values: { title: string }) => tasksApi.create(values),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      form.reset();
      message.success(`Đã thêm "${created.title}"`);
    },
    onError: (error) => message.error(error instanceof Error ? error.message : 'Thêm task thất bại'),
  });

  return <TaskForm form={form} submitting={create.isPending} onSubmit={(values) => create.mutate(values)} />;
}
