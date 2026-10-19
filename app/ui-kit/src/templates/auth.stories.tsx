// Templates/Auth — 3 trang auth hoàn chỉnh ghép từ ui-kit (không component mới):
// SignIn: useForm zod validate thật (mode onBlur) + focus-first-invalid khi submit
// sai + Button loading demo; SignUp: useFieldArray emails động + Checkbox terms +
// Password showStrength; Split: ảnh picsum + Parallax nhẹ một bên.
// Lưu ý: bộ Icon (50 tên primeicons) không có brand glyph → nút social dùng
// external-link đại diện, KHÔNG tự vẽ SVG (rule 9).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { z } from 'zod';
import {
  Button,
  Checkbox,
  Divider,
  Field,
  Icon,
  Input,
  InputOTP,
  Link,
  Parallax,
  Password,
  Result,
  Switch,
  Tour,
  useCountdown,
  useFieldArray,
  useForm,
} from '../index';

const meta = { title: 'Templates/Auth', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

// ── Sign-in — zod validate thật, submit sai → focus ô đầu tiên, đúng → loading 1.2s ──

const signInSchema = z.object({
  email: z.string().min(1, 'Cần nhập email').email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});
type SignInForm = z.infer<typeof signInSchema>;

function SignInCard() {
  // initialValues rỗng-có-khóa: values luôn là string → zod báo message thân thiện
  // ("Cần nhập email") thay vì "expected string, received undefined" khi submit trống.
  const form = useForm<SignInForm>({
    schema: signInSchema,
    initialValues: { email: '', password: '' },
    mode: 'onBlur',
  });
  const [submitting, setSubmitting] = useState(false);
  const [remembered, setRemembered] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [capsOn, setCapsOn] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-4">
      <div>
        <div className="text-h2 font-bold text-ink">Đăng nhập</div>
        <div className="text-body text-ink3">Vào bảng công việc của bạn</div>
      </div>
      <form
        noValidate
        className="grid gap-3"
        onKeyUp={(e) => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
        onSubmit={form.handleSubmit(async (data) => {
          setSubmitting(true);
          await new Promise((r) => setTimeout(r, 1200)); // demo API call
          setSubmitting(false);
          setDone(data.email);
          setTourOpen(true); // onboarding 3 bước chạy thật sau login
        })}
      >
        <Field label="Email" htmlFor="signin-email" required error={form.errors.email}>
          <Input
            id="signin-email"
            name="email"
            type="email"
            placeholder="name@company.vn"
            value={form.values.email ?? ''}
            onChange={form.handleChange('email')}
            onBlur={form.handleBlur('email')}
            invalid={!!form.errors.email}
          />
        </Field>
        <Field label="Mật khẩu" htmlFor="signin-password" required error={form.errors.password}>
          {/* Password không expose name/id → focus-first-invalid chạm email trước
           * (ô đầu form); password báo lỗi qua Field.error. */}
          <Password
            value={form.values.password ?? ''}
            onChange={(v) => form.setValue('password', v)}
            placeholder="••••••••"
            ariaLabel="Mật khẩu"
          />
        </Field>
        {capsOn && (
          <span role="status" className="flex items-center gap-1.5 text-meta text-st-doing">
            <Icon name="exclamation-triangle" size={12} /> Caps Lock đang bật
          </span>
        )}
        <div className="flex items-center justify-between">
          <Checkbox checked={remembered} onChange={setRemembered}>
            <span className="text-meta text-ink3">Ghi nhớ tôi</span>
          </Checkbox>
          <Link href="#forgot" className="text-meta">
            Quên mật khẩu?
          </Link>
        </div>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          Đăng nhập
        </Button>
      </form>
      <Divider>hoặc tiếp tục với</Divider>
      <div className="grid grid-cols-2 gap-2">
        <Button icon={<Icon name="external-link" size={14} />}>Google</Button>
        <Button icon={<Icon name="external-link" size={14} />}>GitHub</Button>
      </div>
      {done && (
        <div role="status" className="rounded-lg bg-st-done/10 px-3 py-2 text-body text-st-done">
          Đăng nhập thành công (demo) — {done}
        </div>
      )}
      <Tour
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        steps={[
          { title: 'Chào mừng 👋', description: 'Đây là form auth ghép từ Field + Input + Password + useForm — validation chạy bằng zod schema.' },
          { title: 'Bảo mật sẵn', description: 'Password có showStrength, OTP 2FA và quên mật khẩu dùng InputOTP + useCountdown — xem các story bên dưới.' },
          { title: 'Dark 1 click', description: 'Toolbar Theme trên Storybook đổi data-bp-theme — cả trang cascade theo token, không cần code riêng.' },
        ]}
      />
    </div>
  );
}

export const SignIn: Story = {
  name: 'Sign-in — zod validate + focus-first-invalid + loading',
  render: () => (
    <div className="flex min-h-[540px] items-center justify-center p-8">
      <SignInCard />
    </div>
  ),
};

// ── Sign-up — useFieldArray emails động + terms Checkbox + strength meter ──

const signUpSchema = z.object({
  name: z.string().min(2, 'Cần nhập tên (≥ 2 ký tự)'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
  emails: z
    .array(z.object({ email: z.string().email('Email không hợp lệ') }))
    .min(1, 'Cần ít nhất 1 email'),
  terms: z.boolean().refine((v) => v === true, { message: 'Cần đồng ý điều khoản' }),
});
type SignUpForm = z.infer<typeof signUpSchema>;
type EmailRow = SignUpForm['emails'][number];

function SignUpCard() {
  const form = useForm<SignUpForm>({
    schema: signUpSchema,
    initialValues: { emails: [{ email: '' }] },
  });
  const arr = useFieldArray<SignUpForm, 'emails', EmailRow>(form, 'emails');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="flex w-full max-w-[440px] flex-col gap-4">
      <div>
        <div className="text-h2 font-bold text-ink">Tạo tài khoản</div>
        <div className="text-body text-ink3">Miễn phí — không cần thẻ</div>
      </div>
      <form
        noValidate
        className="grid gap-3"
        onSubmit={form.handleSubmit(async () => {
          setSubmitting(true);
          await new Promise((r) => setTimeout(r, 1000));
          setSubmitting(false);
          setDone(true);
        })}
      >
        <Field label="Tên" htmlFor="signup-name" required error={form.errors.name}>
          <Input
            id="signup-name"
            name="name"
            placeholder="Nguyễn Văn A"
            value={form.values.name ?? ''}
            onChange={form.handleChange('name')}
            onBlur={form.handleBlur('name')}
            invalid={!!form.errors.name}
          />
        </Field>
        <Field label="Mật khẩu" htmlFor="signup-password" required error={form.errors.password}>
          <Password
            value={form.values.password ?? ''}
            onChange={(v) => form.setValue('password', v)}
            placeholder="Tối thiểu 8 ký tự"
            showStrength
            ariaLabel="Mật khẩu mới"
          />
        </Field>
        <fieldset className="m-0 border-none p-0">
          <legend className="mb-1 p-0 text-label font-semibold text-ink2">
            Email liên hệ <span aria-hidden="true" className="text-st-fail">*</span>
          </legend>
          <div className="grid gap-2">
            {arr.fields.map((row, i) => (
              <div key={i} className="flex items-start gap-2">
                <Field
                  label={i === 0 ? undefined : `Email ${i + 1}`}
                  htmlFor={`signup-email-${i}`}
                  error={form.errors[`emails.${i}.email`]}
                  className="flex-1"
                >
                  <Input
                    id={`signup-email-${i}`}
                    name={arr.nameAt(i, 'email')}
                    type="email"
                    placeholder="name@company.vn"
                    value={row.email}
                    invalid={!!form.errors[`emails.${i}.email`]}
                    onChange={(e) => arr.update(i, { email: e.target.value })}
                  />
                </Field>
                <Button
                  type="text"
                  aria-label={`Xoá email ${i + 1}`}
                  icon={<Icon name="times" size={14} />}
                  onClick={() => arr.remove(i)}
                />
              </div>
            ))}
          </div>
          <Button
            type="default"
            size="small"
            icon={<Icon name="plus" size={12} />}
            onClick={() => arr.append({ email: '' })}
          >
            Thêm email
          </Button>
          {typeof form.errors.emails === 'string' && (
            <div className="mt-1 text-meta text-st-fail">{form.errors.emails}</div>
          )}
        </fieldset>
        <div className="grid gap-1">
          <Checkbox
            checked={form.values.terms === true}
            onChange={(v) => form.setValue('terms', v)}
          >
            <span className="text-meta text-ink2">
              Tôi đồng ý <Link href="#terms">điều khoản dịch vụ</Link>
            </span>
          </Checkbox>
          {form.errors.terms && (
            <div className="text-meta text-st-fail">{form.errors.terms}</div>
          )}
        </div>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          Tạo tài khoản
        </Button>
      </form>
      {done && (
        <div role="status" className="rounded-lg bg-st-done/10 px-3 py-2 text-body text-st-done">
          Tài khoản đã được tạo (demo) — kiểm tra email liên hệ.
        </div>
      )}
    </div>
  );
}

export const SignUp: Story = {
  name: 'Sign-up — useFieldArray emails + terms + strength meter',
  render: () => (
    <div className="flex min-h-[640px] items-center justify-center p-8">
      <SignUpCard />
    </div>
  ),
};

// ── Split layout — ảnh picsum + Parallax nhẹ bên trái, form bên phải ──

function SplitLayoutDemo() {
  return (
    <div className="grid min-h-[560px] w-full grid-cols-1 overflow-hidden rounded-xl border border-line md:grid-cols-2">
      <div className="relative hidden overflow-hidden md:block">
        <Parallax speed={0.12} scale className="absolute inset-0 size-full">
          <img
            src="https://picsum.photos/seed/wakii-auth/900/1400"
            alt=""
            className="size-full scale-110 object-cover"
          />
        </Parallax>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--scrim-4)] to-transparent p-8">
          <div className="text-h3 font-semibold text-white">Wakii — việc nhóm, gọn một bảng</div>
          <div className="mt-1 text-body text-white/80">
            Giao việc, theo dõi saga status và deadline trong một màn hình.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <SignInCard />
      </div>
    </div>
  );
}

export const SplitLayout: Story = {
  name: 'Split layout — picsum image + Parallax (left) / form (right)',
  render: () => (
    <div className="p-8">
      <SplitLayoutDemo />
    </div>
  ),
};

// ── Motion-max additions (2026-10-18): forgot-password (OTP + countdown thật) ·
// magic-link · SSO buttons ──

/** ForgotPassword — 2 bước: email → mã OTP 6 số; resend dùng useCountdown 30s thật. */
export const ForgotPassword: Story = {
  name: 'Forgot password — InputOTP + useCountdown resend',
  render: () => <ForgotPasswordDemo />,
};

function ForgotPasswordDemo() {
  const [email, setEmail] = useState('alice@demo.local');
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [reset, setReset] = useState(false);
  const cooldown = useCountdown(30);

  return (
    <div className="flex w-full max-w-[380px] flex-col gap-4 rounded-xl border border-line bg-s2 p-6">
      <div>
        <div className="text-h2 font-bold text-ink">Quên mật khẩu</div>
        <div className="text-body text-ink3">Nhập email — chúng tôi gửi mã xác nhận 6 số.</div>
      </div>
      {reset ? (
        <Result status="success" title="Đã đặt lại" subTitle="Mật khẩu mới đã gửi vào email của bạn." />
      ) : (
        <>
          <Field label="Email" htmlFor="forgot-email" required>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sent}
            />
          </Field>
          {sent && (
            <Field label="Mã xác nhận" required hint="Mã demo — nhập bất kỳ 6 số">
              <InputOTP length={6} value={otp} onChange={setOtp} ariaLabel="Mã xác nhận quên mật khẩu" />
            </Field>
          )}
          <div className="flex items-center gap-2">
            {!sent ? (
              <Button type="primary" disabled={!email.includes('@')} onClick={() => { setSent(true); cooldown.start(); }}>
                Gửi mã
              </Button>
            ) : (
              <>
                <Button
                  size="small"
                  disabled={cooldown.isRunning}
                  onClick={() => { cooldown.reset(); cooldown.start(); }}
                >
                  {cooldown.isRunning ? `Gửi lại sau ${cooldown.seconds}s` : 'Gửi lại mã'}
                </Button>
                <Button type="primary" size="small" disabled={otp.length < 6} onClick={() => setReset(true)}>
                  Xác nhận
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** MagicLink — không mật khẩu: email → link đăng nhập gửi vào hộp thư. */
export const MagicLink: Story = {
  name: 'Magic link — passwordless email',
  render: () => <MagicLinkDemo />,
};

function MagicLinkDemo() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="w-full max-w-[400px]">
        <Result
          status="info"
          title="Kiểm tra hộp thư"
          subTitle={`Chúng tôi đã gửi link đăng nhập một lần tới ${email || 'email của bạn'}. Link hết hạn sau 15 phút.`}
          extra={<Button onClick={() => setSent(false)}>Dùng email khác</Button>}
        />
      </div>
    );
  }
  return (
    <div className="flex w-full max-w-[380px] flex-col gap-4 rounded-xl border border-line bg-s2 p-6">
      <div>
        <div className="text-h2 font-bold text-ink">Đăng nhập bằng link</div>
        <div className="text-body text-ink3">Không cần mật khẩu — một link, một lần dùng.</div>
      </div>
      <Field label="Email" htmlFor="magic-email" required>
        <Input id="magic-email" type="email" placeholder="name@company.vn" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="primary" icon={<Icon name="external-link" size={14} />} disabled={!email.includes('@')} onClick={() => setSent(true)}>
        Gửi magic link
      </Button>
      <Divider>hoặc</Divider>
      <div className="grid gap-2">
        <Button icon={<Icon name="external-link" size={14} />}>Tiếp tục với Google</Button>
        <Button icon={<Icon name="external-link" size={14} />}>Tiếp tục với Microsoft</Button>
        <Button icon={<Icon name="external-link" size={14} />}>Tiếp tục với GitHub</Button>
      </div>
      <span className="text-center text-meta text-ink3">Bộ Icon kit không có brand glyph — nút SSO dùng external-link đại diện (rule 9).</span>
    </div>
  );
}
