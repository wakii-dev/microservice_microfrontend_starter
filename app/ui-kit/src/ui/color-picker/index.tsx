// ColorPicker — swatch grid + native input[type=color] fallback + hex display.
import { useState } from 'react';

const PRESETS = ['#1677ff', '#722ed1', '#13c2c2', '#52c41a', '#fa8c16', '#f5222d', '#eb2f96', '#faad14'];

export interface ColorPickerProps {
  value?: string;
  onChange?: (hex: string) => void;
  presets?: string[];
  className?: string;
}

export function ColorPicker({ value = '#1677ff', onChange, presets = PRESETS, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`inline-flex flex-col gap-2${className ? ` ${className}` : ''}`}>
      <button type="button" aria-label="Chọn màu" onClick={() => setOpen((o) => !o)}
        className="size-8 cursor-pointer rounded-lg border border-line focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none" style={{ background: value }} />
      {open && (
        <div className="relative z-[var(--z-popover)] inline-flex flex-col gap-2 rounded-xl border border-line bg-s2 p-3 shadow-[var(--shadow-pop)]">
          <div className="grid grid-cols-4 gap-1">
            {presets.map((c) => (
              <button key={c} type="button" aria-label={c} onClick={() => onChange?.(c)}
                className={`size-7 cursor-pointer rounded-lg border ${value === c ? 'border-accent border-2' : 'border-line'}`}
                style={{ background: c }} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={value} onChange={(e) => onChange?.(e.target.value)}
              className="size-7 cursor-pointer rounded-1 border border-line" aria-label="Custom color" />
            <input type="text" value={value} onChange={(e) => onChange?.(e.target.value)}
              className="h-7 flex-1 rounded-1 border border-line bg-s2 px-2 text-meta text-ink focus:border-accent-hi focus:outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
