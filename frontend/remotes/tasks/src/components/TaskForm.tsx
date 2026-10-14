// TaskForm — tạo task (aria-label "Form tạo task" là contract, giữ nguyên).
// Fields chỉ xoá khi tạo THÀNH CÔNG; lỗi (banner ở page) giữ nguyên input cho user sửa.
import { FormEvent, useState } from 'react';
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
        <input
          type="text"
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="tsk-form__field">
        Mô tả
        <input
          type="text"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <button type="submit" className="tsk-btn tsk-btn--primary" disabled={submitting}>
        {submitting ? 'Đang tạo…' : 'Tạo task'}
      </button>
    </form>
  );
}
