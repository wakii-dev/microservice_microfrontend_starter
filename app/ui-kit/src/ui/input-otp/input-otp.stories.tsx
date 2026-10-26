import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { InputOTP } from './index';

const meta = { title: 'Forms/InputOTP', component: InputOTP, tags: ['autodocs'] } satisfies Meta<typeof InputOTP>;
export default meta;
type S = StoryObj<typeof meta>;

/** Basic — 6 cells, auto-advance on type. */
export const Basic: S = { args: { length: 6, ariaLabel: 'OTP code' } };

/** FourDigits — length=4 variant. */
export const FourDigits: S = { args: { length: 4, ariaLabel: 'PIN code' } };

/** Disabled — all cells locked. */
export const Disabled: S = { name: 'Disabled', args: { length: 6, value: '123456', disabled: true, ariaLabel: 'Locked OTP' } };

/** Controlled — useState demo: joined value displayed under the cells. */
export const Controlled: S = {
  render: () => <InputOtpControlledDemo />,
};

/** DarkTheme — cells on dark canvas. */
export const DarkTheme: S = {
  render: () => (
    <div data-bp-theme="dark" className="w-[360px] rounded-xl bg-canvas p-4">
      <InputOTP length={6} ariaLabel="OTP code" />
    </div>
  ),
};

function InputOtpControlledDemo() {
  const [v, setV] = useState('');
  return (
    <div className="grid max-w-[320px] gap-3">
      <InputOTP length={6} ariaLabel="OTP code" value={v} onChange={setV} />
      <p className="m-0 font-mono text-meta text-ink3">value: <strong className="text-ink">{v || '—'}</strong></p>
    </div>
  );
}

/* ── Real-world cases (mission #13 — real-world stories sweep) ── */

// Local wrapper — 2FA step: 6-digit code + resend countdown + verify gate.
function OtpLoginInner() {
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(30);
  const complete = code.length === 6;

  // Countdown giả cho demo — reset khi bấm resend (không gửi network thật).
  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

  return (
    <div className="flex w-80 max-w-full flex-col items-center gap-4 rounded-xl border border-line bg-s1 p-6">
      <div className="text-center">
        <div className="text-h2 font-semibold text-ink">Two-factor verification</div>
        <p className="m-0 mt-1 text-meta text-ink2">Enter the 6-digit code sent to you@company.com</p>
      </div>
      <InputOTP length={6} value={code} onChange={setCode} ariaLabel="Verification code" />
      <Button type="primary" block disabled={!complete}>
        Verify
      </Button>
      <span className="text-meta text-ink3">
        {seconds > 0 ? (
          <>
            Resend code in <span className="tabular-nums text-ink2">{seconds}s</span>
          </>
        ) : (
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-0 text-accent underline-offset-2 hover:underline"
            onClick={() => setSeconds(30)}
          >
            Resend code
          </button>
        )}
      </span>
    </div>
  );
}

export const OtpLogin: S = {
  name: 'OtpLogin — 2FA step: resend countdown + verify gated on 6 digits',
  render: () => <OtpLoginInner />,
};

/* ── Customize pass (slots wave 3) — classNames slots + style passthrough ── */

/** CustomStyled — antd v5-style classNames slots (root / cell) + style
 * passthrough. `root` lands on the row span (same element as `className`),
 * `cell` on every single-character input; `style` lands on the root. */
export const CustomStyled: S = {
  name: 'CustomStyled (classNames + style)',
  args: { length: 4 },
  render: (args) => (
    <InputOTP
      {...args}
      classNames={{
        root: 'gap-2',
        cell: 'border-st-done text-st-done',
      }}
      style={{ padding: 6, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}
    />
  ),
};
