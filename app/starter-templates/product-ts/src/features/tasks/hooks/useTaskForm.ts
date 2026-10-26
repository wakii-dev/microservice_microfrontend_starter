// useTaskForm — useForm kit (recipe 1 AGENTS.md ui-kit) + schema zod của
// feature. Hook trả form instance; container gọi form.handleSubmit(onSubmit) —
// sai schema → errors tự set + focus field đầu.
import { useForm } from '@wakii/ui-kit';
import { taskFormSchema, type TaskFormValues } from '../schema/schema';

export function useTaskForm() {
  return useForm<TaskFormValues>({
    schema: taskFormSchema,
    initialValues: { title: '' },
    mode: 'onSubmit',
  });
}
