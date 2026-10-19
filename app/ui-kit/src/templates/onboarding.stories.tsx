// Templates/Onboarding Flow — first-run wizard 4 bước hoàn chỉnh: Steps
// (Hồ sơ → Xác minh → Tuỳ chọn → Xong) + Progress + Tour TỰ CHẠY highlight
// (spotlight box-shadow 9999px scrim, auto-advance 2.6s, pointer-events-none —
// không chặn thao tác) + Field validation useForm+zod THẬT (sai → focus field
// đầu) + InputOTP + useCountdown resend + Button loading mô phỏng verify +
// Result success với icon check-DRAW (stroke-dashoffset transition — không
// keyframe mới). REF-SPEC typography: label MONO 11px/700/2.64 · H1 18px/300 ·
// body 12px/400/0.3. Tokens-only; z-[var(--z-modal)] theo rule 3.
import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { z } from 'zod';
import { Button } from '../ui/button/index';
import { Field } from '../ui/field/index';
import { Input } from '../ui/input/index';
import { InputOTP } from '../ui/input-otp/index';
import { Progress } from '../ui/progress/index';
import { Result } from '../ui/result/index';
import { Steps } from '../ui/steps/index';
import { Switch } from '../ui/switch/index';
import { useCountdown } from '../hooks/useCountdown.js';
import { useForm } from '../hooks/useForm.js';
import { message } from '../ui/message/index.js';

const meta = { title: 'Templates/Onboarding Flow', tags: ['autodocs'] } satisfies Meta;
export default meta;
type S = StoryObj<typeof meta>;

/** OnboardingFlow — wizard first-run 4 bước + tour tự chạy; demo reset được. */
export const OnboardingFlow: S = {
  name: 'Onboarding Flow — 4 bước + tour tự chạy + zod validation (live)',
  render: () => <OnboardingDemo />,
};

/** DarkTheme — cùng flow trên nền dark (data-bp-theme cascade). */
export const DarkTheme: S = {
  name: 'DarkTheme — flow theo token',
  render: () => (
    <div data-bp-theme="dark" className="min-h-screen bg-canvas">
      <OnboardingDemo />
    </div>
  ),
};

const STEP_ITEMS = [
  { title: 'Hồ sơ', description: 'Tên + email' },
  { title: 'Xác minh', description: 'Mã 6 số' },
  { title: 'Tuỳ chọn', description: 'Thông báo' },
  { title: 'Xong', description: 'Sẵn sàng' },
];

const TOUR_META = [
  '4 bước first-run — Progress trên đầu cập nhật theo từng bước hoàn thành.',
  'Validation useForm + zod chạy thật: submit sai → focus ngay field đầu tiên.',
  'Quay lại bất kỳ lúc nào — dữ liệu các bước trước vẫn được giữ nguyên.',
];

const PREFS = [
  { key: 'digest', label: 'Email tổng hợp tuần', desc: 'Gửi mỗi thứ Hai lúc 8:00' },
  { key: 'push', label: 'Push nhắc deadline', desc: 'Trước hạn chót 1 giờ' },
  { key: 'beta', label: 'Xem trước tính năng beta', desc: 'Bật sớm trước khi phát hành' },
  { key: 'newsletter', label: 'Bản tin sản phẩm', desc: 'Cập nhật release hằng tháng' },
] as const;

const profileSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị cần ít nhất 2 ký tự'),
  email: z.string().min(1, 'Email bắt buộc').email('Email không hợp lệ'),
});
type ProfileValues = z.infer<typeof profileSchema>;

/** Icon check VẼ DẦN — stroke-dashoffset transition khi mount (không keyframe mới). */
function CheckDraw() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <svg viewBox="0 0 52 52" className="size-16" aria-hidden="true">
      <circle cx="26" cy="26" r="24" fill="none" stroke="var(--st-done)" strokeWidth="2.5" className="opacity-30" />
      <circle
        cx="26" cy="26" r="24" fill="none" stroke="var(--st-done)" strokeWidth="2.5" strokeLinecap="round"
        style={{ strokeDasharray: 151, strokeDashoffset: drawn ? 0 : 151, transition: 'stroke-dashoffset 800ms var(--ease-enter)' }}
      />
      <path
        d="M14 27 L23 36 L38 18" fill="none" stroke="var(--st-done)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 40, strokeDashoffset: drawn ? 0 : 40, transition: 'stroke-dashoffset 600ms var(--ease-enter) 250ms' }}
      />
    </svg>
  );
}

/** Spotlight tour — khoanh vùng target, scrim ngoài qua box-shadow 9999px;
 * pointer-events-none → không chặn thao tác; re-measure khi resize/layout ổn định. */
function Spotlight({ target }: { target: HTMLElement | null }) {
  const [rect, setRect] = useState<{ top: number; left: number; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!target) {
      setRect(null);
      return undefined;
    }
    const update = () => {
      const r = target.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, w: r.width, h: r.height });
    };
    update();
    const settle = setTimeout(update, 300);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(settle);
      window.removeEventListener('resize', update);
    };
  }, [target]);
  if (!rect) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[var(--z-modal)] rounded-xl border-2 border-accent transition-all duration-300 [box-shadow:0_0_0_9999px_var(--mask)]"
      style={{ top: rect.top - 6, left: rect.left - 6, width: rect.w + 12, height: rect.h + 12 }}
    />
  );
}

function OnboardingDemo() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const cooldown = useCountdown(30);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ digest: true, push: true, beta: false, newsletter: false });
  const [displayName, setDisplayName] = useState('');

  const form = useForm<ProfileValues>({
    schema: profileSchema,
    initialValues: { displayName: '', email: '' },
    mode: 'onSubmit',
  });

  // Tour tự chạy — auto-advance 2.6s/bước, hết bước tự tắt; không chặn thao tác
  const [tourOn, setTourOn] = useState(true);
  const [tourStep, setTourStep] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tourOn) return undefined;
    const t = setTimeout(() => {
      if (tourStep < TOUR_META.length - 1) setTourStep((s) => s + 1);
      else setTourOn(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [tourOn, tourStep]);
  const tourTarget = tourOn ? [stepsRef.current, bodyRef.current, navRef.current][tourStep] ?? null : null;

  const startProfile = () => {
    setSubmitting(true);
    // demo: xác nhận hồ sơ "gửi" 600ms rồi sang bước xác minh
    setTimeout(() => {
      setSubmitting(false);
      setDisplayName(form.values.displayName ?? '');
      setStep(1);
    }, 600);
  };

  const verifyOtp = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      message.success('Đã xác minh email');
      setStep(2);
    }, 700);
  };

  const finish = () => {
    message.success('Onboarding hoàn tất — hẹn gặp trong board!');
    setStep(0);
    setOtp('');
    form.reset();
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-6">
      <div className="w-full max-w-xl">
        {/* Header — REF-SPEC: label MONO 11px/700/2.64 · H1 18px/300 · body 12px/400/0.3 */}
        <div className="mb-4 grid gap-1.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[2.64px] text-accent">
            Orca · First-run setup
          </span>
          <h1 className="m-0 text-[18px] font-light leading-snug tracking-[0.3px] text-ink">
            Thiết lập workspace trong 4 bước.
          </h1>
          <p className="m-0 text-[12px] leading-[1.7] tracking-[0.3px] text-ink2">
            Dưới đây là toàn bộ flow thật — validation, OTP, tour tự chạy đều hoạt động.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-s1 p-6 shadow-lift">
          {/* Progress + Steps — tour target #1 */}
          <div ref={stepsRef} className="grid gap-3">
            <Progress percent={((step + 1) / 4) * 100} showInfo={false} />
            <Steps items={STEP_ITEMS} current={step} />
          </div>

          {/* Panel bước hiện tại — tour target #2 */}
          <div ref={bodyRef} className="mt-6 min-h-[218px]">
            {step === 0 && (
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit(() => startProfile())}
              >
                <Field label="Tên hiển thị" htmlFor="ob-name" required error={form.errors.displayName}>
                  <Input
                    id="ob-name"
                    name="displayName"
                    placeholder="Nguyễn Văn A"
                    value={form.values.displayName ?? ''}
                    onChange={form.handleChange('displayName')}
                    invalid={!!form.errors.displayName}
                  />
                </Field>
                <Field label="Email công việc" htmlFor="ob-email" required hint="Dùng để đăng nhập + xác minh" error={form.errors.email}>
                  <Input
                    id="ob-email"
                    name="email"
                    type="email"
                    placeholder="you@company.vn"
                    value={form.values.email ?? ''}
                    onChange={form.handleChange('email')}
                    invalid={!!form.errors.email}
                  />
                </Field>
                <div className="flex items-center justify-between">
                  <span className="text-meta text-ink3">Bước 1 / 4</span>
                  <Button htmlType="submit" type="primary" loading={submitting}>
                    Tiếp tục
                  </Button>
                </div>
              </form>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                <p className="m-0 text-[12px] leading-[1.7] tracking-[0.3px] text-ink2">
                  Nhập mã 6 số chúng tôi vừa gửi tới{' '}
                  <strong className="font-semibold text-ink">{form.values.email || 'email của bạn'}</strong>.
                </p>
                <InputOTP length={6} value={otp} onChange={setOtp} ariaLabel="Mã xác minh 6 số" />
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    disabled={cooldown.isRunning}
                    onClick={() => {
                      cooldown.reset();
                      cooldown.start();
                      message.success('Đã gửi lại mã mới');
                    }}
                  >
                    {cooldown.isRunning ? `Gửi lại sau ${cooldown.seconds}s` : 'Gửi lại mã'}
                  </Button>
                  <span className="text-meta text-ink3">Demo: nhập bất kỳ 6 số.</span>
                </div>
                <div className="flex items-center justify-between">
                  <Button size="small" onClick={() => setStep(0)}>
                    Quay lại
                  </Button>
                  <Button type="primary" loading={verifying} disabled={otp.length < 6} onClick={verifyOtp}>
                    Xác minh & tiếp tục
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-2">
                {PREFS.map((p) => (
                  <div
                    key={p.key}
                    className="flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-s3"
                  >
                    <div className="min-w-0">
                      <div className="text-body text-ink">{p.label}</div>
                      <div className="text-meta text-ink3">{p.desc}</div>
                    </div>
                    <Switch
                      checked={prefs[p.key] ?? false}
                      onChange={(v) => setPrefs((prev) => ({ ...prev, [p.key]: v }))}
                      aria-label={p.label}
                    />
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between">
                  <Button size="small" onClick={() => setStep(1)}>
                    Quay lại
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      message.success(`Đã lưu ${Object.values(prefs).filter(Boolean).length} tuỳ chọn`);
                      setStep(3);
                    }}
                  >
                    Hoàn tất
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid justify-items-center gap-4 py-2">
                <CheckDraw />
                <Result
                  status="success"
                  title={`Chào mừng ${displayName || 'bạn'} vào Orca!`}
                  subTitle={`Đã bật ${Object.values(prefs).filter(Boolean).length}/${PREFS.length} tuỳ chọn — email đang chờ xác minh sẽ hết hạn sau 24 giờ.`}
                >
                  <div className="rounded-lg border border-line bg-s2 px-4 py-3 text-label text-ink2">
                    Hồ sơ: <strong className="font-semibold text-ink">{displayName || '—'}</strong> · Tuỳ chọn đã ghi
                    vào workspace.
                  </div>
                </Result>
                <Button type="primary" onClick={finish}>
                  Vào bảng công việc
                </Button>
              </div>
            )}
          </div>

          {/* Footer — tour target #3: replay tour + nhãn flow */}
          <div ref={navRef} className="mt-5 flex items-center justify-between border-t border-line2 pt-4">
            <Button
              size="small"
              type="text"
              onClick={() => {
                setTourStep(0);
                setTourOn(true);
              }}
            >
              ▶ Chạy lại tour
            </Button>
            <span className="text-meta text-ink3">Tiến độ tự lưu — đóng tab không mất dữ liệu demo.</span>
          </div>
        </div>
      </div>

      {/* Tour: spotlight + caption (pointer-events-none overlay, không chặn thao tác) */}
      <Spotlight target={tourTarget} />
      {tourOn && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-6 z-[var(--z-modal)] mx-auto flex w-max max-w-[90vw] items-center gap-3 rounded-xl border border-line bg-s1 px-4 py-3 text-body text-ink2 shadow-lift"
        >
          <span aria-live="polite">
            {tourStep + 1}/{TOUR_META.length} · {TOUR_META[tourStep]}
          </span>
          <Button size="small" type="text" onClick={() => setTourOn(false)}>
            Bỏ qua tour
          </Button>
        </div>
      )}
    </div>
  );
}
