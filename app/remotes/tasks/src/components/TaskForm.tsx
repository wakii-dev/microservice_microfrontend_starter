// TaskForm — tạo task (aria-label "Form tạo task" là contract, giữ nguyên).
// Fields chỉ xoá khi tạo THÀNH CÔNG; lỗi (banner ở page) giữ nguyên input cho user sửa.
// Tier 1 ui-kit (2026-10-17): Input/Textarea/Button thay native + .tsk-btn css.
import { FormEvent, useState } from 'react';
import { Button, Input, Textarea } from '@wakii/ui-kit';
import type { CreateTaskInput } from '../api';

interface TaskFormProps {
  /** true = tạo OK — chỉ khi đó xoá input (lỗi → banner ở page + giữ draft user). */
  onCreate: (input: CreateTaskInput) => Promise<boolean>;
}

export function TaskForm({ onCreate }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ok = await onCreate({ title: title.trim(), description: description.trim() || undefined });
      if (ok) {
        setTitle('');
        setDescription('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="tsk-form" onSubmit={handleSubmit} aria-label="Form tạo task">
      <label className="tsk-form__field">
        Tiêu đề
        <Input
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="tsk-form__field">
        Mô tả
        <Textarea
          name="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <Button type="primary" htmlType="submit" disabled={submitting}>
        {submitting ? 'Đang tạo…' : 'Tạo task'}
      </Button>
    </form>
  );
}
