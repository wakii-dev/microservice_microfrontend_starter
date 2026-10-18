// TaskForm — tạo task (aria-label "Form tạo task" là contract, giữ nguyên).
// react-hook-form (libs adopt 2026-10-17): form state qua useForm — fields chỉ reset
// khi tạo THÀNH CÔNG; lỗi (banner ở page) giữ nguyên input cho user sửa.
import { useForm } from 'react-hook-form';
import { Button, Icon, Input, Textarea } from '@wakii-dev/ui-kit';
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
    <form
      className="flex w-full flex-row flex-wrap items-end gap-3 rounded-3 border border-line bg-s2 p-4"
      onSubmit={submit}
      aria-label="Form tạo task"
    >
      <label className="flex flex-col gap-1 text-label text-ink2 [flex:1_1_200px]">
        Tiêu đề
        <Input
          {...register('title', { required: true, maxLength: 200 })}
          required
          maxLength={200}
        />
      </label>
      <label className="flex flex-col gap-1 text-label text-ink2 [flex:1_1_200px]">
        Mô tả
        <Textarea {...register('description')} rows={2} />
      </label>
      <Button type="primary" htmlType="submit" disabled={isSubmitting} icon={<Icon name="plus" />}>
        {isSubmitting ? 'Đang tạo…' : 'Tạo task'}
      </Button>
    </form>
  );
}
