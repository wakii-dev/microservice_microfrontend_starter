// TaskForm — form tạo task (Field + Input + Button, recipe 1 ui-kit). Nhận form
// instance TỪ container (useTaskForm) — component này chỉ render, không giữ state.
import type { FormEvent } from 'react';
import { Button, Field, Input, type FormInstance } from '@wakii/ui-kit';
import type { TaskFormValues } from '../schema/schema';

export interface TaskFormProps {
  form: FormInstance<TaskFormValues>;
  submitting?: boolean;
  /** Được gọi SAU khi schema validate pass (giá trị đã parse). */
  onSubmit: (values: TaskFormValues) => void;
}

export function TaskForm({ form, submitting = false, onSubmit }: TaskFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit(onSubmit);
  };

  return (
    <form className="flex items-start gap-2" onSubmit={handleSubmit} noValidate>
      <Field label="Task mới" htmlFor="task-title" error={form.errors.title} className="flex-1">
        <Input
          id="task-title"
          name="title"
          placeholder="Ví dụ: Nối API thật"
          value={form.values.title}
          invalid={!!form.errors.title}
          onChange={form.handleChange('title')}
          onBlur={form.handleBlur('title')}
        />
      </Field>
      <Button htmlType="submit" type="primary" loading={submitting} disabled={submitting}>
        Thêm
      </Button>
    </form>
  );
}
