// Password — Input password + toggle hiện/ẩn + strength meter.
// Customize pass (slots wave 3): classNames slots (root/field/input/toggle/
// strengthMeter) + style passthrough — default path (không truyền) giữ nguyên DOM.
import classNames from 'classnames';
import { useState, type CSSProperties } from 'react';
import { Input } from '../input/index';
import { Icon } from '../icons/index.js';

/** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định (consumer append). */
export interface PasswordClassNames {
  /** Div gốc bọc field + meter — cùng element với className prop. */
  root?: string;
  /** Div relative bọc input + nút toggle. */
  field?: string;
  /** Input password (class đổ qua Input className — merge sau structural). */
  input?: string;
  /** Button eye hiện/ẩn mật khẩu. */
  toggle?: string;
  /** Hàng strength meter (3 thanh + nhãn) — chỉ render khi showStrength + có value. */
  strengthMeter?: string;
}

export interface PasswordProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  showStrength?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots wave 3) — merge sau class mặc định. */
  classNames?: PasswordClassNames;
}

function strength(v: string): 0 | 1 | 2 | 3 {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9!@#$%^&*()]/.test(v)) s++;
  return Math.min(3, s) as 0 | 1 | 2 | 3;
}

const STRENGTH_LABEL = ['', 'Yếu', 'Trung bình', 'Mạnh'];
const STRENGTH_COLOR = ['', 'bg-st-fail', 'bg-st-doing', 'bg-st-done'];

export function Password(props: PasswordProps) {
  const { value: valueProp, onChange, placeholder, showStrength, disabled, ariaLabel = 'Mật khẩu', className, style } = props;
  const slots = props.classNames;
  const [visible, setVisible] = useState(false);
  const [internal, setInternal] = useState('');
  const value = valueProp ?? internal;
  const level = strength(value);

  return (
    <div className={classNames(slots?.root, className)} style={style}>
      <div className={classNames('relative', slots?.field)}>
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          disabled={disabled}
          aria-label={ariaLabel}
          placeholder={placeholder}
          className={slots?.input}
          onChange={(e) => {
            setInternal(e.target.value);
            onChange?.(e.target.value);
          }}
        />
        <button
          type="button"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          onClick={() => setVisible((v) => !v)}
          className={classNames('absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-1 border-none bg-transparent text-label text-ink3 transition-colors duration-200 ease-[var(--ease-smooth)] hover:text-ink2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40', slots?.toggle)}
        >
          <Icon name={visible ? 'eye-slash' : 'eye'} size={16} />
        </button>
      </div>
      {showStrength && value && (
        <div className={classNames('mt-1 flex items-center gap-1', slots?.strengthMeter)}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-pill transition-colors duration-300 ease-[var(--ease-smooth)] ${i <= level ? STRENGTH_COLOR[level] : 'bg-line2'}`} />
          ))}
          <span className="ml-1 text-meta text-ink3">{STRENGTH_LABEL[level]}</span>
        </div>
      )}
    </div>
  );
}
