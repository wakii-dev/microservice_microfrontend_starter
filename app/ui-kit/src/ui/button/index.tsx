// Button — antd look, modernize pass (vision-audit 2026-10-18: phẳng/thấp/radius nhỏ,
// secondary mất định nghĩa trên nền trắng): mặc định h-9 (36px antd middle), rounded-lg
// 8px, font-medium + tracking nhẹ, default variant bg-s2 + border-line rõ (hover bg-s3),
// primary hover accent-hi, focus ring accent/40 + offset canvas, active scale 0.98,
// loading → Spinner 3.5 inline + cursor-wait. Disabled dùng token --bg-disabled (dark-safe).
// API GIỮ NGUYÊN (type/danger/icon/htmlType/block/disabled) — chỉ thêm/nâng visual,
// không break consumers (không ai trong repo truyền size=).
// Map từ style cũ của repo: .tsk-btn--primary → type=primary · .tsk-btn/.sh-btn →
// type=default · .tsk-btn--ghost/.sh-btn--ghost → type=text · .tsk-btn--danger →
// type=primary+danger · .tsk-btn--danger-ghost → type=text+danger.
// API theo antd: `type` = variant, `htmlType` = HTML button type.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../spinner/index';

export type ButtonType = 'primary' | 'default' | 'text';
export type ButtonSize = 'small' | 'middle' | 'large';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Variant visual — antd Button type. */
  type?: ButtonType;
  /** HTML button type (antd htmlType) — mặc định 'button' an toàn trong form. */
  htmlType?: 'button' | 'submit' | 'reset';
  /** Đỏ (nguy hiểm) — với type=primary nền đặc, type=text chữ đỏ, type=default rơi về variant default. */
  danger?: boolean;
  /** antd size: small (h-8) / middle (h-9, mặc định) / large (h-10). */
  size?: ButtonSize;
  /** Loading — Spinner 3.5 inline thay icon + disable + cursor-wait (antd loading). */
  loading?: boolean;
  /** Full-width (antd block). */
  block?: boolean;
  /** Icon trước nhãn (antd icon) — ẩn khi loading (Spinner thay). */
  icon?: ReactNode;
  children?: ReactNode;
  /** Append sau structural classes (pattern antd). */
  className?: string;
}

const BASE =
  'inline-flex items-center justify-center gap-1 rounded-lg border font-medium tracking-[0.01em] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:border-line disabled:bg-[var(--bg-disabled)] disabled:text-ink4 active:scale-[0.98] hover:-translate-y-px hover:shadow-[var(--shadow-lift)]';

const SIZE: Record<ButtonSize, string> = {
  small: 'h-8 px-3 text-label',
  middle: 'h-9 px-4 text-body',
  large: 'h-10 px-5 text-body',
} as const;

const VARIANTS: Record<ButtonType, string> = {
  'primary': 'border-accent bg-accent text-white hover:border-accent-hi hover:bg-accent-hi',
  'default': 'border-line bg-s2 text-ink hover:bg-s3',
  'text': 'border-transparent bg-transparent text-ink hover:bg-s3',
};

const DANGER: Partial<Record<ButtonType, string>> = {
  'primary': 'border-st-fail bg-st-fail text-white hover:border-st-fail/85 hover:bg-st-fail/85',
  'text': 'border-transparent bg-transparent text-st-fail hover:bg-st-fail/12',
};

export function Button({
  type = 'default',
  htmlType = 'button',
  danger = false,
  size = 'middle',
  loading = false,
  block = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const variant = danger ? (DANGER[type] ?? VARIANTS[type]) : VARIANTS[type];
  // cursor tách khỏi BASE — loading cần cursor-wait đè cursor-pointer (cùng specificity,
  // đặt điều kiện thay vì append sau để không phụ thuộc thứ tự CSS utilities).
  return (
    <button
      type={htmlType}
      disabled={disabled || loading}
      className={`${BASE} ${loading ? 'cursor-wait' : 'cursor-pointer'} ${SIZE[size]} ${variant}${block ? ' w-full' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {loading && <Spinner size="default" label="" className="-ml-1" aria-hidden="true" />}
      {!loading && icon}
      {children}
    </button>
  );
}
