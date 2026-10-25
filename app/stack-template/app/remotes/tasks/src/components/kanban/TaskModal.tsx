// TaskModal — form tạo/sửa task qua Modal ui-kit (thay form trụ đầu trang +
// edit inline): ui-kit useForm + zod (same schema cũ), Modal onOk →
// requestSubmit qua formRef (footer OK nằm ngoài <form>). onSubmit true → đóng;
// false (lỗi) → giữ modal + draft. aria-label "Form tạo task"/"Form sửa task".
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { Field, Input, Modal, Textarea, useForm } from '@wakii/ui-kit';

const taskSchema = z.object({
  title: z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string().trim(),
});
type TaskValues = z.infer<typeof taskSchema>;

export interface TaskModalProps {
  open: boolean;
  /** 'create' | 'edit' — đổi label + aria + values init. */
  mode: 'create' | 'edit';
  /** Giá trị hiện tại (edit) — reset mỗi lần modal mở. */
  initial: { title: string; description: string };
  submitting: boolean;
  onClose: () => void;
  /** true = OK → đóng modal; false (lỗi server) → giữ mở + draft. */
  onSubmit: (values: { title: string; description: string }) => Promise<boolean>;
}

export function TaskModal({ open, mode, initial, submitting, onClose, onSubmit }: TaskModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<TaskValues>({ schema: taskSchema, initialValues: initial });

  // Mỗi lần mở → reset về giá trị mới (create: rỗng; edit: đúng task đang sửa).
  useEffect(() => {
    if (open) form.reset(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial thay đổi theo task đang mở
  }, [open, mode, initial.title, initial.description]);

  const submit = form.handleSubmit(async (values) => {
    if (submitting) return;
    const ok = await onSubmit(values);
    if (ok) onClose();
  });

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Tạo task mới' : 'Sửa task'}
      okText={mode === 'create' ? 'Tạo task' : 'Lưu'}
      confirmLoading={submitting}
      onOk={() => formRef.current?.requestSubmit()}
      onCancel={onClose}
    >
      <form
        ref={formRef}
        aria-label={mode === 'create' ? 'Form tạo task' : 'Form sửa task'}
        className="flex flex-col gap-3"
        onSubmit={submit}
      >
        <Field label="Tiêu đề" htmlFor="task-modal-title" required error={form.errors.title}>
          <Input
            id="task-modal-title"
            name="title"
            maxLength={200}
            autoFocus
            value={form.values.title}
            invalid={!!form.errors.title}
            onChange={form.handleChange('title')}
            onBlur={form.handleBlur('title')}
          />
        </Field>
        <Field label="Mô tả" htmlFor="task-modal-description">
          <Textarea
            id="task-modal-description"
            name="description"
            rows={3}
            value={form.values.description}
            onChange={form.handleChange('description')}
          />
        </Field>
        {/* nút submit thật (ẩn thị giác — footer OK của Modal điều khiển qua requestSubmit) */}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  );
}
