// InputNumber — PrimeReact pattern: input + stepper icon buttons XẶP DỌC trong
// mép phải (input group: input + border-left phân tách), Icon chevron up/down
// (bộ icons dùng chung), keyboard ↑↓, min/max/step clamp, disabled.
import { useState, type FocusEvent } from 'react';
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
  return <Icon name="chevron-up" size={10} className={className} />;
}
function ChevronDownIcon({ className }: { className?: string }) {
  return <Icon name="chevron-down" size={10} className={className} />;
}

export function InputNumber({
  value, onChange, min = -Infinity, max = Infinity, step = 1,
  disabled = false, invalid = false, ariaLabel, className,
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
    <span
      className={`inline-flex w-full items-stretch overflow-hidden rounded-lg border bg-s2 ${borderCls}${disabled ? ' bg-s3 opacity-60' : ''}${className ? ` ${className}` : ''}`}
    >
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
        className="h-8 min-w-0 flex-1 border-none bg-transparent px-3 text-body text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {/* Stepper — 2 nút xếp dọc fill nửa control (h-1/2, tổng đúng chiều cao input,
          không khe/overshoot). KHÔNG radius riêng: chỉ góc NGOÀI bo theo radius control
          (up = top-right, down = bottom-right; container overflow-hidden clip theo
          rounded-lg nên lying flush viền — góc trong = 0). Divider giữa = hairline
          border-t border-line (border-box nên vẫn fit 100%). active dùng opacity thay
          scale — scale co nút làm hở viền (user feedback 2026-10-18). */}
      <span className={`flex flex-col border-l ${invalid ? 'border-st-fail' : 'border-line'} ${disabled ? 'opacity-50' : ''}`}>
        <button
          type="button" aria-label="Tăng" disabled={disabled} onClick={() => bump(step)}
          className="flex h-1/2 w-7 cursor-pointer items-center justify-center rounded-tr-lg rounded-br-none border-none bg-s3 text-ink2 transition-colors hover:bg-line2 hover:text-accent active:opacity-70"
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button" aria-label="Giảm" disabled={disabled} onClick={() => bump(-step)}
          className="flex h-1/2 w-7 cursor-pointer items-center justify-center rounded-br-lg rounded-tr-none border-t border-line bg-s3 text-ink2 transition-colors hover:bg-line2 hover:text-accent active:opacity-70"
        >
          <ChevronDownIcon />
        </button>
      </span>
    </span>
  );
}
