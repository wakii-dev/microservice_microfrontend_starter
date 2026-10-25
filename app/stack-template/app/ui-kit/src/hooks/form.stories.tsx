// form.stories.tsx — section Hooks: useForm + zod demo (LoginForm lỗi tiếng Việt).
// Inline error text: text-meta text-st-fail (ngôn ngữ design-system); toast Message.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from './useForm.js';
import { Input } from '../ui/input/index.js';
import { Button } from '../ui/button/index.js';
import { message } from '../ui/message/index.js';

const meta = { title: 'Theming & Motion/Hooks/Form', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

const loginSchema = z.object({
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-meta text-st-fail">{msg}</p>;
}

function DemoForm() {
  const form = useForm({ schema: loginSchema, initialValues: { email: '', password: '' } });
  const [submitted, setSubmitted] = useState<LoginFormValues | null>(null);

  return (
    <form
      className="flex w-80 flex-col gap-3"
      onSubmit={form.handleSubmit((data) => {
        setSubmitted(data);
        message.success(`Đăng nhập OK: ${data.email}`);
      })}
    >
      <label className="flex flex-col gap-1">
        <span className="text-body text-ink">Email</span>
        <Input
          name="email"
          placeholder="you@demo.local"
          value={form.values.email}
          invalid={!!form.errors.email}
          onChange={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
        />
        <FieldError msg={form.errors.email} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-body text-ink">Mật khẩu</span>
        <Input
          name="password"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          value={form.values.password}
          invalid={!!form.errors.password}
          onChange={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
        />
        <FieldError msg={form.errors.password} />
      </label>
      <div className="flex gap-2">
        <Button htmlType="submit">Đăng nhập</Button>
        <Button htmlType="button" onClick={() => form.reset()}>
          Reset
        </Button>
      </div>
      {submitted && (
        <p className="text-meta text-st-done">Parsed: {JSON.stringify(submitted)}</p>
      )}
    </form>
  );
}

export const LoginFormDemo: S = {
  name: 'LoginForm — useForm + zod (lỗi tiếng Việt)',
  render: () => <DemoForm />,
};
