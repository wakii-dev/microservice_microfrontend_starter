// field.stories.tsx — Primitives/Field (batch ⑩ worker B): wrapper cơ bản + demo THẬT
// Input + useForm (react-hook-form) + zodResolver — label/error/hint sống theo validation.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../button/index.js';
import { Input, Textarea } from '../input/index.js';
import { Select } from '../select/index.js';
import { Field } from './index.js';

const meta = {
  title: 'Forms/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Wrapper label + control + error/hint. Id error/hint suy từ htmlFor ({htmlFor}-error/{htmlFor}-hint) — consumer nối aria-describedby trên input. Error ưu tiên hơn hint.',
      },
    },
  },
} satisfies Meta<typeof Field>;
export default meta;

type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  name: 'Basic',
  args: {
    label: 'Tiêu đề',
    htmlFor: 'field-title',
    hint: 'Ngắn gọn, rõ nghĩa',
    children: <Input id="field-title" placeholder="Vd: Sửa bug login" />,
  },
};

export const Required: Story = {
  name: 'Required marker',
  args: {
    label: 'Email',
    htmlFor: 'field-email',
    required: true,
    children: <Input id="field-email" type="email" placeholder="ban@congty.vn" />,
  },
};

export const ErrorThayHint: Story = {
  name: 'Error replaces hint',
  args: {
    label: 'Email',
    htmlFor: 'field-error',
    error: 'Email không hợp lệ',
    hint: 'Dùng email công việc',
    children: <Input id="field-error" invalid aria-invalid aria-describedby="field-error-error" defaultValue="khong-phai-email" />,
  },
};

/** WithSelect — Field wraps any control, not just Input (antd Form.Item parity). */
export const WithSelect: Story = {
  name: 'With select control',
  args: {
    label: 'Region',
    htmlFor: 'field-region',
    hint: 'Filter tasks by workspace region',
    children: (
      <Select
        ariaLabel="Region"
        placeholder="Pick a region…"
        options={[
          { label: 'HN — Hà Nội', value: 'hn' },
          { label: 'SG — Sài Gòn', value: 'sg' },
          { label: 'DN — Đà Nẵng', value: 'dn' },
        ]}
      />
    ),
  },
};

// ── Demo thật: useForm (react-hook-form) + zod — error lấy từ formState ──────────

const schema = z.object({
  title: z.string().min(3, 'Tiêu đề tối thiểu 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  note: z.string().max(200, 'Tối đa 200 ký tự'),
});
type FormValues = z.infer<typeof schema>;

function ZodFormDemo() {
  const [submitted, setSubmitted] = useState<FormValues | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', email: '', note: '' },
  });

  return (
    <form className="flex max-w-sm flex-col gap-4" onSubmit={handleSubmit(setSubmitted)} noValidate>
      <Field label="Tiêu đề" htmlFor="demo-title" required error={errors.title?.message} hint="Ngắn gọn, rõ nghĩa">
        <Input
          id="demo-title"
          invalid={!!errors.title}
          placeholder="Vd: Sửa bug login"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'demo-title-error' : 'demo-title-hint'}
          {...register('title')}
        />
      </Field>
      <Field label="Email" htmlFor="demo-email" required error={errors.email?.message}>
        <Input
          id="demo-email"
          type="email"
          invalid={!!errors.email}
          placeholder="ban@congty.vn"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'demo-email-error' : undefined}
          {...register('email')}
        />
      </Field>
      <Field label="Ghi chú" htmlFor="demo-note" error={errors.note?.message} hint="Tuỳ chọn — tối đa 200 ký tự">
        <Textarea
          id="demo-note"
          rows={3}
          invalid={!!errors.note}
          aria-describedby={errors.note ? 'demo-note-error' : 'demo-note-hint'}
          {...register('note')}
        />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="primary" htmlType="submit">
          Gửi
        </Button>
        {submitted && <span className="text-meta text-st-done">Đã gửi: {JSON.stringify(submitted)}</span>}
      </div>
    </form>
  );
}

export const ZodForm: Story = {
  name: 'Real form — useForm + zod',
  render: () => <ZodFormDemo />,
};

export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => (
    <div data-bp-theme="dark" className="w-96 rounded-xl bg-canvas p-4">
      <Field label="Tiêu đề" htmlFor="field-dark" hint="Ngắn gọn, rõ nghĩa">
        <Input id="field-dark" placeholder="Vd: Sửa bug login" />
      </Field>
    </div>
  ),
};
