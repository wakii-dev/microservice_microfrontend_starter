// TaskForm — tạo task (aria-label "Form tạo task" là contract, giữ nguyên).
// ui-kit useForm + zod (app-fit migration 2026-10-18, thay react-hook-form):
// fields chỉ reset khi tạo THÀNH CÔNG; lỗi (banner ở page) giữ nguyên input cho
// user sửa. Zod = source of truth validate: title trim + bắt buộc + ≤200 ký tự,
// description optional (trim, rỗng → undefined khi gửi).
// Motion redesign: tạo thành công → badge "Đã tạo task" pop spring cạnh nút
// (AnimatePresence, tự ẩn 2.2s) thay feedback text tĩnh; fields reset mượt theo
// transition màu sẵn có của Input.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { z } from 'zod';
import { Button, Field, Icon, Input, Textarea, useForm } from '@wakii/ui-kit';
import type { CreateTaskInput } from '../api';

interface TaskFormProps {
  /** true = tạo OK — chỉ khi đó xoá input (lỗi → banner ở page + giữ draft user). */
  onCreate: (input: CreateTaskInput) => Promise<boolean>;
}

const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string().trim(),
});
type FormValues = z.infer<typeof taskFormSchema>;

export function TaskForm({ onCreate }: TaskFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const form = useForm<FormValues>({
    schema: taskFormSchema,
    initialValues: { title: '', description: '' },
  });

  // Badge tự ẩn — cleanup timer khi unmount/re-trigger
  useEffect(() => {
    if (!justCreated) return;
    const timer = window.setTimeout(() => setJustCreated(false), 2200);
    return () => window.clearTimeout(timer);
  }, [justCreated]);

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      // description trim rỗng → undefined (contract optional)
      const ok = await onCreate({
        title: values.title,
        description: values.description || undefined,
      });
      if (ok) {
        form.reset(); // chỉ reset khi tạo thành công
        setJustCreated(true); // badge pop spring (motion redesign)
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form
      className="flex w-full flex-row flex-wrap items-end gap-3 rounded-3 border border-line bg-s2 p-4"
      onSubmit={submit}
      aria-label="Form tạo task"
    >
      <Field label="Tiêu đề" htmlFor="task-form-title" error={form.errors.title} className="[flex:1_1_200px]">
        <Input
          id="task-form-title"
          name="title"
          maxLength={200}
          value={form.values.title}
          invalid={!!form.errors.title}
          onChange={form.handleChange('title')}
          onBlur={form.handleBlur('title')}
        />
      </Field>
      <Field label="Mô tả" htmlFor="task-form-description" className="[flex:1_1_200px]">
        <Textarea
          id="task-form-description"
          name="description"
          rows={2}
          value={form.values.description}
          onChange={form.handleChange('description')}
        />
      </Field>
      <Button type="primary" htmlType="submit" loading={submitting} icon={<Icon name="plus" />}>
        {submitting ? 'Đang tạo…' : 'Tạo task'}
      </Button>
      <div className="flex min-h-[32px] items-center" aria-live="polite">
        <AnimatePresence>
          {justCreated && (
            <motion.span
              key="created-badge"
              role="status"
              aria-label="Đã tạo task"
              className="inline-flex items-center gap-1 rounded-pill border border-st-done/30 bg-st-done/12 px-3 py-1 text-label font-medium text-st-done"
              initial={{ opacity: 0, scale: 0.6, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -4, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', bounce: 0.45, duration: 0.5 }}
            >
              <Icon name="check-circle" size={12} />
              Đã tạo task
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
