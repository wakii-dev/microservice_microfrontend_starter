// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Textarea } from './index';
import { Button } from '../button/index';
import { Field } from '../field/index';
import { Icon } from '../icons/index';

const meta = {
  title: 'Forms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Input>;
export default meta;
type S = StoryObj<typeof meta>;

type Story = StoryObj<typeof meta>;

export const CoBan: Story = {
  args: { 'aria-label': 'Tiêu đề', placeholder: 'Nhập tiêu đề…' },
};

export const Invalid: Story = {
  args: { 'aria-label': 'Email', placeholder: 'email@demo.local', invalid: true },
};

export const VungNhapNhieuDong: Story = {
  name: 'Textarea',
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
      <Textarea aria-label="Mô tả" placeholder="Mô tả…" />
      <Textarea aria-label="Lỗi" placeholder="Mô tả…" invalid />
    </div>
  ),
};

/** Sizes — h-6 / h-8 (default) / h-10, same scale as Select/Button. */
export const Sizes: Story = {
  name: 'Sizes — small / middle / large',
  render: () => (
    <div className="grid max-w-[320px] gap-3">
      <Input size="small" aria-label="Small size" placeholder="Small (h-6)" />
      <Input aria-label="Middle size" placeholder="Middle (h-8, default)" />
      <Input size="large" aria-label="Large size" placeholder="Large (h-10)" />
    </div>
  ),
};

/** Affix — prefix icon / suffix text inside one bordered wrapper (antd affix pattern). */
export const Affix: Story = {
  name: 'Affix — prefix icon + suffix text',
  render: () => (
    <div className="grid max-w-[320px] gap-3">
      <Input aria-label="Search tasks" prefix={<Icon name="search" size={14} />} placeholder="Search tasks…" />
      <Input aria-label="Weight" suffix="kg" placeholder="0" />
    </div>
  ),
};

/** AllowClear — shows the × button once there is a value; click clears (controlled). */
export const AllowClear: Story = {
  name: 'AllowClear — × clears the value (controlled)',
  render: () => <InputAllowClearDemo />,
};

/** Disabled — locked, dimmed canvas. */
export const Disabled: Story = {
  args: { 'aria-label': 'Locked input', value: 'Managed by your organization', disabled: true },
};

/** TextareaCount — showCount + maxLength renders a N/M counter below. */
export const TextareaCount: Story = {
  name: 'Textarea — showCount + maxLength',
  render: () => <TextareaCountDemo />,
};

function InputAllowClearDemo() {
  const [v, setV] = useState('Type then clear…');
  return (
    <div className="grid max-w-[320px] gap-3">
      <Input aria-label="Clearable input" allowClear value={v} onChange={(e) => setV(e.target.value)} placeholder="Type something…" />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v || '—'}</strong></p>
    </div>
  );
}

function TextareaCountDemo() {
  const [v, setV] = useState('');
  return (
    <Textarea
      aria-label="Short bio"
      value={v}
      onChange={(e) => setV(e.target.value)}
      maxLength={120}
      showCount
      rows={3}
      placeholder="Tell us about yourself…"
    />
  );
}

/* ── Real-world cases (mission #13 — real-world stories sweep) ── */

// Local wrapper — sign-up form state (email validation + password toggle).
function SignUpFormInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const emailInvalid = submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordShort = submitted && password.length < 8;

  return (
    <form
      className="flex w-80 max-w-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field label="Email" htmlFor="signup-email" required error={emailInvalid ? 'Enter a valid email address' : undefined}>
        <Input
          id="signup-email"
          type="email"
          invalid={emailInvalid}
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </Field>
      <Field
        label="Password"
        htmlFor="signup-password"
        required
        hint="At least 8 characters"
        error={passwordShort ? 'Password is too short' : undefined}
      >
        <Input
          id="signup-password"
          type={showPassword ? 'text' : 'password'}
          invalid={passwordShort}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          suffix={
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="cursor-pointer border-none bg-transparent text-ink3 hover:text-ink"
              onClick={() => setShowPassword((s) => !s)}
            >
              <Icon name={showPassword ? 'eye-slash' : 'eye'} size={14} />
            </button>
          }
        />
      </Field>
      <Button htmlType="submit" type="primary" block>
        Create account
      </Button>
      {submitted && !emailInvalid && !passwordShort && (
        <p className="m-0 text-meta text-st-done">Looks good — account would be created (demo).</p>
      )}
    </form>
  );
}

export const SignUpForm: S = {
  name: 'SignUpForm — real sign-up: validation + password toggle',
  render: () => <SignUpFormInner />,
};
