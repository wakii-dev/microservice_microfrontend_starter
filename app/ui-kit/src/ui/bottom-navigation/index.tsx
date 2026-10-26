// BottomNavigation — thanh điều hướng dưới mobile (MUI lite): fixed bottom,
// active accent + bp-switch-pop, tuỳ chọn hideOnScroll (ẩn khi cuộn xuống).
import classNames from 'classnames';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface BottomNavItem {
  /** Khóa duy nhất của mục (dùng làm value). */
  key: string;
  /** Nhãn dưới icon. */
  label: string;
  /** Icon từ bộ primeicons (<Icon name size>). */
  icon: ReactNode;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface BottomNavigationClassNames {
  /** <nav> thanh dưới (fixed bottom). */
  root?: string;
  /** <ul role="tablist">. */
  list?: string;
  /** <li> mỗi mục. */
  item?: string;
  /** <button role="tab"> (áp cả active). */
  itemButton?: string;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  /** Controlled mục đang chọn; không truyền → uncontrolled (defaultValue). */
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
  /** Ẩn thanh khi cuộn xuống, hiện lại khi cuộn lên. */
  hideOnScroll?: boolean;
  /** aria-label cho nav (khuyến nghị đặt tên màn hình). */
  ariaLabel?: string;
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: BottomNavigationClassNames;
}

export function BottomNavigation(props: BottomNavigationProps) {
  const { items, value, defaultValue, onChange, hideOnScroll = false, ariaLabel, className, style } = props;
  const slots = props.classNames;
  const [inner, setInner] = useState<string | undefined>(defaultValue);
  const active = value ?? inner;
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    if (!hideOnScroll) return;
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 40);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hideOnScroll]);

  function pick(key: string) {
    if (value === undefined) setInner(key);
    onChange?.(key);
  }

  return (
    <nav
      aria-label={ariaLabel}
      className={classNames(
        'fixed inset-x-0 bottom-0 z-[var(--z-modal)] border-t border-line bg-s1 pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-[var(--ease-enter)]',
        hideOnScroll && hidden && 'translate-y-full',
        slots?.root,
        className,
      )}
      style={style}
    >
      <ul role="tablist" className={classNames('m-0 flex list-none items-stretch justify-around p-0', slots?.list)}>
        {items.map((item) => {
          const selected = item.key === active;
          return (
            <li key={item.key} role="presentation" className={classNames('flex-1', slots?.item)}>
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => pick(item.key)}
                className={classNames(
                  'flex w-full cursor-pointer flex-col items-center gap-0.5 border-none bg-transparent px-2 pb-2 pt-2 text-meta transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                  selected ? 'text-accent' : 'text-ink3 hover:text-ink2',
                  slots?.itemButton,
                )}
              >
                <span className={selected ? 'animate-[bp-switch-pop_var(--motion-fast)_var(--ease-enter)]' : ''} aria-hidden={false}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
