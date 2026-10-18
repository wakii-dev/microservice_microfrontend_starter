// Icons — SVG paths khớp primeicons visual (filter family dùng trong Table header).
// viewBox 0 0 14 14 — kích thước PrimeReact header icon mặc định.
// Ghi: filter/sort/sort-up/sort-down có sẵn trong Icon set — migrate khi bổ sung
// filter-fill + filter-slash (đang thiếu variant fill/slash).
interface IconProps { className?: string }

export function FilterIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M0.5 1.5h13L9 7.5v4.5l-4-1.5V7.5L0.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

export function FilterFillIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M0.5 1.5h13L9 7.5v4.5l-4-1.5V7.5L0.5 1.5z" fill="currentColor"/>
    </svg>
  );
}

export function FilterSlashIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M0.5 1.5h13L9 7.5v4.5l-4-1.5V7.5L0.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
      <line x1="1" y1="13" x2="13" y2="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}
