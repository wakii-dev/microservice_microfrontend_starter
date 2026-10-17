// Button — antd look (decision 2026-10-17): type primary|default|text + danger boolean.
// Map từ style cũ của repo: .tsk-btn--primary → type=primary · .tsk-btn/.sh-btn →
// type=default · .tsk-btn--ghost/.sh-btn--ghost → type=text · .tsk-btn--danger →
// type=primary+danger · .tsk-btn--danger-ghost → type=text+danger.
// API theo antd: `type` = variant, `htmlType` = HTML button type. Tailwind utilities
// (@theme inline trong styles/tailwind.css) — hover antd: primary sáng accent-hi,
// default đổi chữ+viền sang accent.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonType = 'primary' | 'default' | 'text';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Variant visual — antd Button type. */
  type?: ButtonType;
  /** HTML button type (antd htmlType) — mặc định 'button' an toàn trong form. */
  htmlType?: 'button' | 'submit' | 'reset';
  danger?: boolean;
  children: ReactNode;
  /** Append sau structural classes (pattern antd). */
  className?: string;
}

const BASE =
  'inline-flex cursor-pointer items-center justify-center gap-1 rounded-2 border h-8 px-[15px] text-body transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS: Record<ButtonType, string> = {
  'primary': 'border-accent bg-accent text-white hover:border-accent-hi hover:bg-accent-hi',
  'default': 'border-line bg-s2 text-ink hover:border-accent hover:text-accent',
  'text': 'border-transparent bg-transparent text-ink hover:bg-s3',
};

const DANGER: Partial<Record<ButtonType, string>> = {
  'primary': 'border-st-fail bg-st-fail text-white hover:border-[#ff7875] hover:bg-[#ff7875]',
  'text': 'border-transparent bg-transparent text-st-fail hover:bg-st-fail/12',
};

export function Button({
  type = 'default',
  htmlType = 'button',
  danger = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const variant = danger ? (DANGER[type] ?? VARIANTS[type]) : VARIANTS[type];
  return (
    <button
      type={htmlType}
      className={`${BASE} ${variant}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
}
