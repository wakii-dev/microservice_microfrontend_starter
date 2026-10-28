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

/* ── Customize pass (SÓNG-3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / input / prefix / suffix)
 * + style passthrough (SÓNG-3 pattern). `root` lands on the bordered element
 * (the input when plain, the affix wrapper when prefix/suffix is set); `style`
 * lands straight on that same element; the user's className always comes last. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="grid max-w-[420px] gap-4">
      <Input
        aria-label="Custom styled plain"
        placeholder="root + input slots on the input itself…"
        classNames={{
          root: 'border-accent border-dashed',
          input: 'italic tracking-wide',
        }}
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
      />
      <Input
        aria-label="Custom styled affix"
        prefix={<Icon name="search" size={14} />}
        suffix={<span className="font-mono">.vn</span>}
        placeholder="Slots across the affix wrapper…"
        classNames={{
          root: 'rounded-pill border-st-done',
          prefix: 'text-st-done',
          input: 'uppercase placeholder:normal-case',
          suffix: 'text-st-done',
        }}
        style={{ letterSpacing: '0.04em' }}
      />
    </div>
  ),
};

/** TextareaCustomStyled — classNames slots (root / textarea / count) + style
 * passthrough (SÓNG-3 pattern). `root` lands on the outer wrapper div, `textarea`
 * on the <textarea> itself, `count` on the character counter; `style` lands on
 * the <textarea>; the user's className always comes last. */
export const TextareaCustomStyled: Story = {
  name: 'Textarea CustomStyled (classNames + style)',
  render: () => (
    <div className="grid max-w-[420px] gap-4">
      <Textarea
        aria-label="Custom styled textarea"
        placeholder="Slots on wrapper / textarea / count…"
        rows={3}
        maxLength={80}
        showCount
        classNames={{
          root: 'rounded-xl',
          textarea: 'border-accent border-dashed italic',
          count: 'text-st-done',
        }}
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
      />
    </div>
  ),
};

/* ── autoSize (MUI/antd parity) — JS measure: grows with content, clamps at maxRows ── */

/** Uncontrolled autoSize demo — type a paragraph to watch it grow; at maxRows it scrolls. */
function TextareaDemoAutoSize(props: { mode: 'boolean' | 'clamp' }) {
  const [v, setV] = useState('');
  const isClamp = props.mode === 'clamp';
  return (
    <Textarea
      aria-label={isClamp ? 'Autosize clamped textarea' : 'Autosize textarea'}
      autoSize={isClamp ? { minRows: 2, maxRows: 5 } : true}
      value={v}
      onChange={(e) => setV(e.target.value)}
      maxLength={isClamp ? 200 : undefined}
      showCount={isClamp}
      placeholder={
        isClamp
          ? 'Type a paragraph — grows to 5 rows, then scrolls…'
          : 'Type a paragraph — grows unbounded from 2 rows…'
      }
      className="max-w-[480px]"
    />
  );
}

export const TextareaAutoSize: Story = {
  name: 'Textarea — autoSize boolean (unbounded from 2 rows)',
  render: () => <TextareaDemoAutoSize mode="boolean" />,
};
export const TextareaAutoSizeClamp: Story = {
  name: 'Textarea — autoSize {minRows:2, maxRows:5} + showCount',
  render: () => <TextareaDemoAutoSize mode="clamp" />,
};
