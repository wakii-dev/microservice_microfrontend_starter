// Chips — multi-value input với tags (antd Tags Select lite).
import { useState, type KeyboardEvent } from 'react';

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
    <span className={`inline-flex min-h-8 w-full flex-wrap items-center gap-1 rounded-2 border border-line bg-s2 px-2 py-1${disabled ? ' cursor-not-allowed opacity-50' : ''}${className ? ` ${className}` : ''}`}>
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-0.5 rounded-1 bg-s3 px-1.5 py-0.5 text-meta text-ink">
          {tag}
          {!disabled && (
            <button type="button" aria-label={`Xoá ${tag}`} onClick={() => removeTag(tag)}
              className="cursor-pointer border-none bg-transparent p-0 text-ink3 hover:text-st-fail">×</button>
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
