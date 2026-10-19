// Anchor — in-page navigation kiểu antd: scroll-spy active theo section + click
// scroll mượt tới section. active xác định bằng scroll + getBoundingClientRect
// (section cuối cùng có top ≤ offsetTop) qua scroll event của container — không
// IntersectionObserver (jsdom/test + không deps mới). Vertical rail + ink dot,
// active accent; a11y: <nav> landmark + aria-current trên link đang active.
// Depth contract 2026-10-19: selected tint accent/8 + hover tint ink/4
// (color-mix trên token), dot slide 2px hover, mọi transition ease-smooth 240ms.
import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

export interface AnchorLinkItem {
  key?: string;
  /** Selector đoạn (`#section-id` — trùng id của section trên trang). */
  href: string;
  title: ReactNode;
  /** Link cấp con (indented, rail riêng — antd nested). */
  children?: AnchorLinkItem[];
}

export type AnchorGetContainer = () => HTMLElement | Window;

export interface AnchorProps {
  items: AnchorLinkItem[];
  /** Khoảng cách px từ đỉnh viewport để coi section là active (mặc định 0); với affix là khoảng sticky. */
  offsetTop?: number;
  /** Callback sau khi click link (e đã preventDefault — component tự cuộn). */
  onClick?: (e: MouseEvent, link: AnchorLinkItem) => void;
  /** Ghim anchor khi cuộn (sticky top = offsetTop — bản nhẹ của antd Affix). */
  affix?: boolean;
  /** Scroll container chứa các section (mặc định window). */
  getContainer?: AnchorGetContainer;
  className?: string;
}

/** Dẹt hoá cây item (cha trước con) — thứ tự document cho scroll-spy. */
function flattenItems(items: AnchorLinkItem[]): string[] {
  const hrefs: string[] = [];
  const walk = (list: AnchorLinkItem[]) => {
    for (const item of list) {
      hrefs.push(item.href);
      if (item.children) walk(item.children);
    }
  };
  walk(items);
  return hrefs;
}

/** Section cuối cùng có đỉnh lên tới (hoặc vượt qua) mép offsetTop → active. */
function findActiveHref(hrefs: string[], offsetTop: number): string | undefined {
  let current: string | undefined;
  for (const href of hrefs) {
    const el = document.getElementById(href.slice(1));
    if (!el) continue;
    if (el.getBoundingClientRect().top <= offsetTop + 1) current = href;
  }
  return current;
}

export function Anchor({
  items,
  offsetTop = 0,
  onClick,
  affix = false,
  getContainer,
  className,
}: AnchorProps) {
  const hrefs = useMemo(() => flattenItems(items), [items]);
  const [active, setActive] = useState<string | undefined>(undefined);

  useEffect(() => {
    const container = getContainer?.() ?? window;
    const onScroll = () => setActive(findActiveHref(hrefs, offsetTop));
    onScroll(); // sync trạng thái ngay khi mount/đổi items
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [hrefs, offsetTop, getContainer]);

  const scrollToHref = (href: string) => {
    const el = document.getElementById(href.slice(1));
    if (!el) return;
    const container = getContainer?.();
    if (container && container !== window) {
      container.scrollTo({ top: el.offsetTop - offsetTop, behavior: 'smooth' });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - offsetTop;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleClick = (e: ReactMouseEvent<HTMLAnchorElement>, item: AnchorLinkItem) => {
    e.preventDefault();
    onClick?.(e.nativeEvent, item);
    scrollToHref(item.href);
  };

  const renderList = (list: AnchorLinkItem[]) => (
    <ul className="m-0 list-none border-l border-line p-0">
      {list.map((item) => {
        const isActive = active === item.href;
        return (
          <li key={item.key ?? item.href}>
            <a
              href={item.href}
              onClick={(e) => handleClick(e, item)}
              aria-current={isActive || undefined}
              className={`group relative block rounded-lg py-1 pl-4 text-body no-underline outline-none transition-[color,background-color] duration-[240ms] [transition-timing-function:var(--ease-smooth)] focus-visible:ring-2 focus-visible:ring-accent/40 ${
                isActive
                  ? 'bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-accent'
                  : 'text-ink2 hover:bg-[color-mix(in_srgb,var(--ink)_4%,transparent)] hover:text-ink'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute -left-[3px] top-1/2 size-1.5 -translate-y-1/2 rounded-pill transition-[background-color,transform] duration-[240ms] [transition-timing-function:var(--ease-smooth)] group-hover:translate-x-0.5 ${
                  isActive ? 'bg-accent' : 'bg-ink4'
                }`}
              />
              {item.title}
            </a>
            {item.children && item.children.length > 0 && (
              <div className="pl-4">{renderList(item.children)}</div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const list = renderList(items);

  if (affix) {
    return (
      <div style={{ position: 'sticky', top: offsetTop }} className={className}>
        <nav aria-label="Table of contents" className="w-40 text-body">
          {list}
        </nav>
      </div>
    );
  }
  return (
    <nav aria-label="Table of contents" className={`w-40 text-body ${className ?? ''}`}>
      {list}
    </nav>
  );
}
