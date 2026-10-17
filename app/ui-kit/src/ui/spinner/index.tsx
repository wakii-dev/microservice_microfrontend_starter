// Spinner — vòng quay busy (hand-off §3). Tailwind migration 2026-10-17: animate-spin
// utilities thay bp-spinner css; size small|default|large (antd size mapping).
export interface SpinnerProps {
  /** aria-label BẮT BUỘC — màn đọc cần biết busy của cái gì. */
  label: string;
  size?: 'small' | 'default' | 'large';
  className?: string;
}

const SIZE = { small: 'size-3 border-2', default: 'size-3.5 border-2', large: 'size-5 border-[3px]' } as const;

export function Spinner({ label, size = 'default', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block ${SIZE[size]} animate-spin rounded-full border-current border-t-transparent${className ? ` ${className}` : ''}`}
    />
  );
}
