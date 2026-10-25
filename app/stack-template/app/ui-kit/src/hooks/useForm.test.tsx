// useForm tests — behavior thật: form render với Input ui-kit (invalid = !!errors[field]),
// submit thiếu → errors + focus field đầu, sửa đúng → onSubmit(parsed), mode onBlur/
// onChange, reset, schema transformers (trim/min), isValid/touched/setValue, schema non-object.
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { useForm } from './useForm.js';
import { Input } from '../ui/input/index.js';

afterEach(cleanup);

const schema = z.object({
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});

type LoginFormValues = z.infer<typeof schema>;
type FormHandle = ReturnType<typeof useForm<LoginFormValues>>;

function LoginForm({
  onSubmit,
  mode = 'onSubmit',
}: {
  onSubmit?: (data: LoginFormValues) => void;
  mode?: 'onSubmit' | 'onBlur' | 'onChange';
}) {
  const form = useForm({ schema, initialValues: { email: '', password: '' }, mode });
  return (
    <form onSubmit={form.handleSubmit(onSubmit ?? vi.fn())}>
      <Input
        name="email"
        placeholder="Email"
        value={form.values.email}
        invalid={!!form.errors.email}
        onChange={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
      />
      {form.errors.email && <p className="text-meta text-st-fail">{form.errors.email}</p>}
      <Input
        name="password"
        type="password"
        placeholder="Mật khẩu"
        value={form.values.password}
        invalid={!!form.errors.password}
        onChange={form.handleChange('password')}
        onBlur={form.handleBlur('password')}
      />
      {form.errors.password && <p className="text-meta text-st-fail">{form.errors.password}</p>}
      <button type="submit">Đăng nhập</button>
      <button type="button" onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
}

const VALID = { email: 'alice@demo.local', password: 'demo-password' };

describe('useForm — onSubmit mode', () => {
  it('submit thiếu → errors từng field + input mang class invalid + focus field đầu', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByText('Email bắt buộc')).toHaveClass('text-st-fail', 'text-meta');
    expect(screen.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toHaveClass('border-st-fail');
    expect(screen.getByPlaceholderText('Mật khẩu')).toHaveClass('border-st-fail');
    // focus rơi vào field đầu theo thứ tự issues (email)
    expect(document.activeElement).toBe(screen.getByPlaceholderText('Email'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('sửa đúng → onSubmit nhận parsed data + errors sạch', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={onSubmit} />);
    await user.type(screen.getByPlaceholderText('Email'), VALID.email);
    await user.type(screen.getByPlaceholderText('Mật khẩu'), VALID.password);
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(onSubmit).toHaveBeenCalledWith(VALID);
    expect(screen.queryByText(/bắt buộc/)).toBeNull();
  });

  it('schema transformers (trim/min) — min chạy sau trim, onSubmit nhận giá trị đã trim', async () => {
    const onSubmit = vi.fn();
    const trimSchema = z.object({ name: z.string().trim().min(3, 'Tên tối thiểu 3 ký tự') });
    function TrimForm() {
      const form = useForm({ schema: trimSchema, initialValues: { name: '' } });
      return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Input name="name" value={form.values.name} onChange={form.handleChange('name')} />
          {form.errors.name && <p>{form.errors.name}</p>}
          <button type="submit">Gửi</button>
        </form>
      );
    }
    const user = userEvent.setup();
    render(<TrimForm />);
    await user.type(screen.getByRole('textbox'), 'ab');
    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    // 'ab' sau trim vẫn 2 ký tự → min(3) fail
    expect(screen.getByText('Tên tối thiểu 3 ký tự')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'cd');
    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    expect(onSubmit).toHaveBeenCalledWith({ name: 'abcd' });
  });

  it('reset xoá sạch — values về initial, errors biến mất, input hết invalid', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(screen.getByPlaceholderText('Email')).toHaveClass('border-st-fail');
    await user.type(screen.getByPlaceholderText('Email'), 'x@y.z');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByPlaceholderText('Email')).toHaveValue('');
    expect(screen.getByPlaceholderText('Email')).not.toHaveClass('border-st-fail');
    expect(screen.queryByText(/bắt buộc/)).toBeNull();
  });

  it('isValid phản ánh đúng schema + setValue trực tiếp + touched qua blur', () => {
    let formRef: FormHandle | null = null;
    function Probe() {
      const form = useForm({ schema, initialValues: { email: '', password: '' } });
      formRef = form;
      return (
        <>
          <Input value={form.values.email} onChange={form.handleChange('email')} onBlur={form.handleBlur('email')} />
          <button type="button" onClick={() => form.setValue('password', VALID.password)}>
            set
          </button>
        </>
      );
    }
    render(<Probe />);
    expect(formRef!.isValid).toBe(false);
    expect(formRef!.touched.email).toBeUndefined();
    fireEvent.blur(screen.getByRole('textbox'));
    expect(formRef!.touched.email).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'set' }));
    expect(formRef!.values.password).toBe(VALID.password);
  });
});

describe('useForm — mode onBlur / onChange', () => {
  it('mode onBlur: rời input sai → lỗi field đó hiện KHÔNG cần submit; field khác sạch', async () => {
    const user = userEvent.setup();
    render(<LoginForm mode="onBlur" />);
    await user.type(screen.getByPlaceholderText('Email'), 'khong-hop-le');
    fireEvent.blur(screen.getByPlaceholderText('Email'));
    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.queryByText(/Mật khẩu/)).toBeNull();
  });

  it('mode onChange: gõ sai hiện lỗi, sửa đúng tự xoá', async () => {
    const user = userEvent.setup();
    render(<LoginForm mode="onChange" />);
    await user.type(screen.getByPlaceholderText('Email'), 'khong-hop-le');
    expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Email'));
    await user.type(screen.getByPlaceholderText('Email'), VALID.email);
    expect(screen.queryByText('Email không hợp lệ')).toBeNull();
  });

  it('mode onSubmit mặc định: gõ sai KHÔNG hiện lỗi tới khi submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByPlaceholderText('Email'), 'khong-hop-le');
    expect(screen.queryByText('Email không hợp lệ')).toBeNull();
  });
});

describe('useForm — schema non-object (root path)', () => {
  it('issue path rỗng → key "root" map đúng message', async () => {
    const onSubmit = vi.fn();
    function Probe() {
      const form = useForm({ schema: z.string().min(5, 'Tối thiểu 5 ký tự'), initialValues: 'ab' });
      return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {form.errors.root && <p>{form.errors.root}</p>}
          <button type="submit">Gửi</button>
        </form>
      );
    }
    const user = userEvent.setup();
    render(<Probe />);
    await user.click(screen.getByRole('button', { name: 'Gửi' }));
    expect(screen.getByText('Tối thiểu 5 ký tự')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
