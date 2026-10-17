// Switch — antd: 44×22 (handle 18) checked nền accent; unchecked rgba(0,0,0,.25);
// small 28×16 (handle 12); disabled; transition motionDurationMid 0.2s.
import type { ReactNode } from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'default' | 'small';
  /** Nhãn trong switch (checked) — antd checkedChildren/unCheckedChildren. */
  checkedChildren?: ReactNode;
  unCheckedChildren?: ReactNode;
  'aria-label'?: string;
  className?: string;
}

export function Switch({
  checked = false,
  onChange,
  disabled = false,
  size = 'default',
  checkedChildren,
  unCheckedChildren,
  className,
  ...rest
}: SwitchProps) {
  const track = size === 'small' ? 'h-4 w-7' : 'h-[22px] w-11';
  const knob = size === 'small' ? 'size-3' : 'size-[18px]';
  const translate = checked
    ? size === 'small'
      ? 'translate-x-[14px]'
      : 'translate-x-[22px]'
    : 'translate-x-[2px]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      {...rest}
      className={`relative inline-flex shrink-0 items-center rounded-pill border-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        checked ? 'bg-accent' : 'bg-[rgba(0,0,0,0.25)]'
      } ${track} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}${className ? ` ${className}` : ''}`}
    >
      <span
        className={`absolute left-0 grid place-items-center rounded-pill bg-white text-[10px] text-ink2 shadow-sm transition-transform ${knob} ${translate}`}
      >
        {checked ? checkedChildren : unCheckedChildren}
      </span>
    </button>
  );
}
