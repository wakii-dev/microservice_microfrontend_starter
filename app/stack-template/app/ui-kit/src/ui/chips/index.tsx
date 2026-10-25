// Chips — multi-value input với tags (antd Tags Select lite).
import { useState, type KeyboardEvent } from 'react';
import { Icon } from '../icons/index.js';

export interface ChipsProps {
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Chips({ value = [], onChange, placeholder = 'Thêm tag…', disabled, className }: ChipsProps) {
  const [input, setInput] = useState('');
  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    onChange?.([...value, t]); setInput('');
  }
  function removeTag(tag: string) { onChange?.(value.filter((v) => v !== tag)); }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addTag(e.currentTarget.value); }
    if (e.key === 'Backspace' && !input && value.length > 0) removeTag(value[value.length - 1]);
  }
  return (
    // Depth contract: rest bg-s3 + ele-1 → focus-within bg-s1 + ring 3px accent/40 (như Input)
    <span className={`inline-flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-line bg-s3 px-2 py-1 shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] focus-within:border-accent-hi focus-within:bg-s1 focus-within:shadow-[var(--ele-2)] focus-within:ring-[3px] focus-within:ring-accent/40${disabled ? ' cursor-not-allowed opacity-50 shadow-none' : ''}${className ? ` ${className}` : ''}`}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-0.5 rounded-1 bg-s3 px-1.5 py-0.5 text-meta text-ink transition-colors duration-200 ease-[var(--ease-smooth)]">
          {tag}
          {!disabled && (
            <button type="button" aria-label={`Xoá ${tag}`} onClick={() => removeTag(tag)}
              className="cursor-pointer rounded-1 border-none bg-transparent p-0 text-ink3 transition-colors duration-200 ease-[var(--ease-smooth)] hover:text-st-fail focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"><Icon name="times" size={10} /></button>
          )}
        </span>
      ))}
      {!disabled && (
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? placeholder : ''} disabled={disabled}
          className="min-w-[80px] flex-1 border-none bg-transparent text-body text-ink placeholder:text-ink4 outline-none" />
      )}
    </span>
  );
}
