// ColorPicker — swatch grid + native input[type=color] fallback + hex display.
// Customize pass (slots wave 3): classNames slots (root/trigger/panel/swatch)
// + style passthrough — default path (không truyền) giữ nguyên DOM/behavior.
import classNames from 'classnames';
import { useState, type CSSProperties } from 'react';

const PRESETS = ['#1677ff', '#722ed1', '#13c2c2', '#52c41a', '#fa8c16', '#f5222d', '#eb2f96', '#faad14'];

/** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định (consumer append). */
export interface ColorPickerClassNames {
  /** Div gốc (cột swatch + panel) — cùng element với className prop. */
  root?: string;
  /** Button swatch trigger (nền = value). */
  trigger?: string;
  /** Panel nổi (grid preset + hàng input custom) — chỉ render khi mở. */
  panel?: string;
  /** Button mỗi preset swatch. */
  swatch?: string;
}

export interface ColorPickerProps {
  value?: string;
  onChange?: (hex: string) => void;
  presets?: string[];
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: ColorPickerClassNames;
}

export function ColorPicker(props: ColorPickerProps) {
  const { value = '#1677ff', onChange, presets = PRESETS, className, style } = props;
  const slots = props.classNames;
  const [open, setOpen] = useState(false);
  return (
    <div className={classNames('inline-flex flex-col gap-2', slots?.root, className)} style={style}>
      <button type="button" aria-label="Chọn màu" onClick={() => setOpen((o) => !o)}
        className={classNames('size-8 cursor-pointer rounded-lg border border-line shadow-[var(--ele-1)] transition-[box-shadow,border-color] duration-200 ease-[var(--ease-smooth)] hover:shadow-[var(--ele-2)] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none', slots?.trigger)} style={{ background: value }} />
      {open && (
        <div className={classNames('relative z-[var(--z-popover)] inline-flex flex-col gap-2 rounded-xl border border-line bg-s2 bg-[image:var(--wash)] p-3 shadow-[var(--shadow-pop),var(--ele-3)]', slots?.panel)}>
          <div className="grid grid-cols-4 gap-1">
            {presets.map((c, i) => (
              <button key={c} type="button" aria-label={c} onClick={() => onChange?.(c)}
                style={{ background: c, animationDelay: `${Math.min(i, 12) * 24}ms` }}
                className={classNames(`size-7 cursor-pointer rounded-lg border transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-smooth)] animate-[bp-slide-up-in_240ms_var(--ease-smooth)_backwards] hover:-translate-y-px hover:shadow-[var(--ele-2)] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${value === c ? 'border-accent border-2' : 'border-line'}`, slots?.swatch)} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={value} onChange={(e) => onChange?.(e.target.value)}
              className="size-7 cursor-pointer rounded-1 border border-line" aria-label="Custom color" />
            <input type="text" value={value} onChange={(e) => onChange?.(e.target.value)}
              className="h-7 flex-1 rounded-1 border border-line bg-s3 px-2 text-meta text-ink tabular-nums transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] focus:border-accent-hi focus:bg-s1 focus:outline-none" />
          </div>
        </div>
      )}
    </div>
  );
}
