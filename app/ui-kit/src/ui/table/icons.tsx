// Icons — SVG paths khớp primeicons visual (filter/sort family).
// viewBox 0 0 14 14 — kích thước PrimeReact header icon mặc định.
import type { ReactNode } from 'react';

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

export function SortAltIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M5 3v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M3 5l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 11V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M7 9l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SortAmountUpIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M4 11V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M2 5l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 3h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 6.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function SortAmountDownIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M4 3v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M2 9l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 3h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 6.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 10h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function TimesIcon({ className }: IconProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
