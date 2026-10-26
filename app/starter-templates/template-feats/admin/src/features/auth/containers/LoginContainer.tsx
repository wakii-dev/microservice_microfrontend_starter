// LoginContainer — recipe 1: useForm + zod schema; auth GIẢ (demo-password) —
// thay by gọi api thật qua shared client khi nối backend. Thành công → '/'.
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { message, useForm } from '@wakii/ui-kit';
import { LoginForm } from '../ui/LoginForm';
import { loginFormSchema, type LoginFormValues } from '../schema/schema';

const DEMO_PASSWORD = 'demo-password';

export function LoginContainer() {
  const form = useForm<LoginFormValues>({
    schema: loginFormSchema,
    initialValues: { email: '', password: '' },
    mode: 'onSubmit',
  });
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleLogin = async (values: LoginFormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      // Auth giả — demo. Nối auth thật: apiFetch('/auth/login', { method: 'POST', body: values })
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (values.password !== DEMO_PASSWORD) {
        throw new Error('Email hoặc mật khẩu không đúng.');
      }
      message.success('Đăng nhập thành công (demo)');
      navigate('/');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Đăng nhập thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return <LoginForm form={form} submitting={submitting} serverError={serverError} onSubmit={handleLogin} />;
}
