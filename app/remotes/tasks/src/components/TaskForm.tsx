// TaskForm — tạo task (aria-label "Form tạo task" là contract, giữ nguyên).
// react-hook-form (libs adopt 2026-10-17): form state qua useForm — fields chỉ reset
// khi tạo THÀNH CÔNG; lỗi (banner ở page) giữ nguyên input cho user sửa.
import { useForm } from 'react-hook-form';
import { Button, Input, Textarea } from '@wakii/ui-kit';
import type { CreateTaskInput } from '../api';

interface TaskFormProps {
  /** true = tạo OK — chỉ khi đó xoá input (lỗi → banner ở page + giữ draft user). */
  onCreate: (input: CreateTaskInput) => Promise<boolean>;
}

interface FormValues {
  title: string;
  description: string;
}

export function TaskForm({ onCreate }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { title: '', description: '' } });

  const submit = handleSubmit(async (values) => {
    if (!values.title.trim()) return;
    const ok = await onCreate({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
    });
    if (ok) reset(); // chỉ reset khi tạo thành công
  });

  return (
    <form className="tsk-form" onSubmit={submit} aria-label="Form tạo task">
      <label className="tsk-form__field">
        Tiêu đề
        <Input
          {...register('title', { required: true, maxLength: 200 })}
          required
          maxLength={200}
        />
      </label>
      <label className="tsk-form__field">
        Mô tả
        <Textarea {...register('description')} rows={2} />
      </label>
      <Button type="primary" htmlType="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang tạo…' : 'Tạo task'}
      </Button>
    </form>
  );
}
