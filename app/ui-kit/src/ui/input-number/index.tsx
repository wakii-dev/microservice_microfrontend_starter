// InputNumber — antd-fidelity (redo 2026-10-19): input + cột stepper LÒNG TRONG
// control mép phải (2 nút full-height nửa trên/dưới, chevron Icon bộ chung 14px,
// hairline border-t chia 2 nút, CHỈ bo góc NGOÀI theo radius control — flush tuyệt
// đối, wrapper overflow-hidden; giữ fix e94b3e4). Hover bg-ink/5 · active bg-ink/10
// + press-scale trên ICON (không scale nút — giữ fix "hở viền" 2026-10-18). Focus
// ring vòng NGOÀI cả control (focus-within). Sizes h-6/8/10 ăn theo họ Input.
// prefix/suffix affixes (pattern antd). Keyboard ↑↓, min/max/step clamp, disabled.
import { useState, type FocusEvent, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface InputNumberProps {
  /** Giá trị khởi tạo lúc mount (đọc 1 lần — state text quản lý nội bộ, prop đổi sau
   * không ghi đè text đang hiển thị). */
  value?: number;
  /** Callback giá trị mới: typing/blur commit hoặc stepper/↑↓. Text rỗng hoặc không
   * phải số → null. Giá trị luôn đã clamp trong [min, max]. */
  onChange?: (value: number | null) => void;
  /** Cận dưới khi clamp (mặc định -Infinity). */
  min?: number;
  /** Cận trên khi clamp (mặc định Infinity). */
  max?: number;
  /** Bước nhảy của nút stepper và phím ↑↓ (mặc định 1). */
  step?: number;
  /** Kích thước theo họ Input: small h-6 · middle h-8 (mặc định) · large h-10. */
  size?: 'small' | 'middle' | 'large';
  /** Node hiển thị trước input (antd prefix). */
  prefix?: ReactNode;
  /** Node hiển thị sau input, TRƯỚC cột stepper (antd suffix). */
  suffix?: ReactNode;
  /** Khoá input + 2 nút stepper, cả nhóm mờ đi (bg-s3 + opacity). */
  disabled?: boolean;
  /** Trạng thái lỗi: viền đỏ --st-fail trên cả input lẫn cột stepper. */
  invalid?: boolean;
  /** Accessible name của input (ràng buộc a11y — luôn truyền). */
  ariaLabel?: string;
  /** Append sau structural classes — escape hatch pattern antd. */
  className?: string;
}

function ChevronUpIcon({ className }: { className?: string }) {
  return <Icon name="chevron-up" size={14} className={className} />;
}
function ChevronDownIcon({ className }: { className?: string }) {
  return <Icon name="chevron-down" size={14} className={className} />;
}

const SIZE_CLS = { small: 'h-6 text-label', middle: 'h-8 text-body', large: 'h-10 text-body' } as const;

export function InputNumber({
  value, onChange, min = -Infinity, max = Infinity, step = 1, size = 'middle',
  prefix, suffix, disabled = false, invalid = false, ariaLabel, className,
}: InputNumberProps) {
  const [text, setText] = useState(value !== undefined ? String(value) : '');

  function commit(raw: string) {
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n)) { onChange?.(null); return; }
    onChange?.(Math.min(max, Math.max(min, n)));
  }

  /** Blur commit: NHẤT QUÁN đồng bộ text về giá trị đã clamp — nhập 99 (max 10) rồi
   * blur thì ô input phải NHẢY về 10 thay vì kẹt số sai trên màn (onChange đã clamp
   * từ trước nhưng text không sync → demo/UX "chưa đúng"). Gõ giữa chừng KHÔNG sync
   * (commit per-keystroke giữ text thô — clamp chỉ ép ở blur, pattern antd). */
  function commitOnBlur(raw: string) {
    commit(raw);
    const n = Number(raw);
    if (raw !== '' && !Number.isNaN(n)) {
      const clamped = Math.min(max, Math.max(min, n));
      if (clamped !== n) setText(String(clamped));
    }
  }

  function bump(delta: number) {
    const base = Number(text) || 0;
    const next = Math.min(max, Math.max(min, base + delta));
    setText(String(next)); onChange?.(next);
  }

  const borderCls = invalid ? 'border-st-fail' : 'border-line focus-within:border-accent-hi';

  return (
    // Depth contract: rest bg-s3 + ele-1 → focus-within bg-s1 + ring 3px accent/40 + ele-2
    <span
      className={`inline-flex w-full items-stretch overflow-hidden rounded-lg border bg-s3 shadow-[var(--ele-1)] transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-smooth)] focus-within:bg-s1 focus-within:shadow-[var(--ele-2)] focus-within:ring-[3px] focus-within:ring-accent/40 ${borderCls}${disabled ? ' bg-s3 opacity-60 shadow-none' : ''}${className ? ` ${className}` : ''}`}
    >
      {prefix && <span className="inline-flex shrink-0 items-center pl-3 text-ink3">{prefix}</span>}
      <input
        type="number"
        aria-label={ariaLabel}
        value={text}
        disabled={disabled}
        onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
        onBlur={(e: FocusEvent<HTMLInputElement>) => commitOnBlur(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); bump(step); }
          if (e.key === 'ArrowDown') { e.preventDefault(); bump(-step); }
        }}
        className={`min-w-0 flex-1 border-none bg-transparent px-3 text-ink tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${SIZE_CLS[size]}`}
      />
      {suffix && <span className="inline-flex shrink-0 items-center text-ink3">{suffix}</span>}
      {/* Stepper — 2 nút xếp dọc fill nửa control (h-1/2, tổng đúng chiều cao input,
          không khe/overshoot). KHÔNG radius riêng: chỉ góc NGOÀI bo theo radius control
          (up = top-right, down = bottom-right; container overflow-hidden clip theo
          rounded-lg nên lying flush viền — góc trong = 0). Divider giữa = hairline
          border-t border-line (border-box nên vẫn fit 100%). Press = nền sâu hơn +
          scale trên ICON (group/up·down) — scale NÚT làm hở viền (fix 2026-10-18,
          không hồi quy). Focus ring nằm ở wrapper (vòng NGOÀI cả control). */}
      <span className={`flex flex-col border-l ${invalid ? 'border-st-fail' : 'border-line'} ${disabled ? 'opacity-50' : ''}`}>
        <button
          type="button" aria-label="Tăng" disabled={disabled} onClick={() => bump(step)}
          className="group/up flex h-1/2 w-7 cursor-pointer items-center justify-center rounded-tr-lg rounded-br-none border-none bg-transparent text-ink2 transition-colors duration-200 ease-[var(--ease-smooth)] hover:bg-ink/5 hover:text-accent active:bg-ink/10"
        >
          <ChevronUpIcon className="transition-transform duration-150 ease-[var(--ease-smooth)] group-active/up:scale-90" />
        </button>
        <button
          type="button" aria-label="Giảm" disabled={disabled} onClick={() => bump(-step)}
          className="group/down flex h-1/2 w-7 cursor-pointer items-center justify-center rounded-br-lg rounded-tr-none border-t border-line bg-transparent text-ink2 transition-colors duration-200 ease-[var(--ease-smooth)] hover:bg-ink/5 hover:text-accent active:bg-ink/10"
        >
          <ChevronDownIcon className="transition-transform duration-150 ease-[var(--ease-smooth)] group-active/down:scale-90" />
        </button>
      </span>
    </span>
  );
}
