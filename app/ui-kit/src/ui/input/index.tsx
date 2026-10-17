// Input + Textarea — antd look (decision 2026-10-17): h-8, border line, focus ring
// accent (0 0 0 2px ~10%), invalid viền đỏ. Native props passthrough (value/onChange/
// id/aria…) → label htmlFor hoạt động như thường; className append sau structural.
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const FIELD_BASE =
  'w-full rounded-2 border bg-s2 px-3 text-body text-ink placeholder:text-ink3 transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-s3 disabled:text-ink3';
const FIELD_OK = 'border-line focus:border-accent focus:ring-accent/10';
const FIELD_INVALID = 'border-st-fail focus:border-st-fail focus:ring-st-fail/10';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Error state — viền + ring đỏ. */
  invalid?: boolean;
  className?: string;
}

export function Input({ invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      className={`${FIELD_BASE} h-8 ${invalid ? FIELD_INVALID : FIELD_OK}${className ? ` ${className}` : ''}`}
      {...rest}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  className?: string;
}

export function Textarea({ invalid = false, className, rows = 3, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      className={`${FIELD_BASE} py-2 ${invalid ? FIELD_INVALID : FIELD_OK}${className ? ` ${className}` : ''}`}
      {...rest}
    />
  );
}
