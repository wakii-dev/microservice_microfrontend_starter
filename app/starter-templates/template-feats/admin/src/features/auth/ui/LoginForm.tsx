// LoginForm — recipe 1 kit (useForm + zod + Field + Input + Button). UI thuần:
// nhận form instance + callbacks từ LoginContainer.
import type { FormEvent } from 'react';
import { Alert, Button, Field, Input, type FormInstance } from '@wakii/ui-kit';
import type { LoginFormValues } from '../schema/schema';

export interface LoginFormProps {
  form: FormInstance<LoginFormValues>;
  submitting?: boolean;
  /** Lỗi server (email/mật khẩu sai) — hiện Alert trên form. */
  serverError?: string | null;
  onSubmit: (values: LoginFormValues) => void;
}

export function LoginForm({ form, submitting = false, serverError, onSubmit }: LoginFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    form.handleSubmit(onSubmit);
  };

  return (
    <form className="flex w-80 flex-col gap-3" onSubmit={handleSubmit} noValidate>
      <Field label="Email" htmlFor="login-email" error={form.errors.email}>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="alice@demo.local"
          value={form.values.email}
          invalid={!!form.errors.email}
          onChange={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
        />
      </Field>
      <Field label="Mật khẩu" htmlFor="login-password" error={form.errors.password}>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.values.password}
          invalid={!!form.errors.password}
          onChange={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
        />
      </Field>
      {serverError ? (
        <Alert type="error" message={serverError} />
      ) : null}
      <Button htmlType="submit" type="primary" loading={submitting} disabled={submitting} block>
        Đăng nhập
      </Button>
    </form>
  );
}
