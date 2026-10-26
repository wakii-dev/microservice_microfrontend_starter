// SlideMenu — menu trượt ngang giữa các cấp (PrimeReact SlideMenu kiểu): track
// flex các "trang cấp" cạnh nhau, vào cấp con = translateX(-100%×depth) +
// transition transform (motion token: duration-200 + ease-[var(--ease-enter)] —
// KHÔNG deps, không JS measure). Cấp con mở bằng click (item có children +
// chevron-right); quay lại bằng nút back (chevron-left + nhãn cấp cha) hoặc
// ESC (pop 1 cấp). Trang không hiện tại inert + aria-hidden — không phá tab
// order. A11y: mỗi cấp role=menu, item role=menuitem, item có con aria-haspopup;
// danger = đỏ; icon qua bộ Icon (KHÔNG tự vẽ glyph).
import classNames from 'classnames';
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface SlideMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  /** Cấp con — lồng được nhiều cấp (mỗi cấp là 1 trang trượt ngang). */
  children?: SlideMenuItem[];
  danger?: boolean;
  onClick?: () => void;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface SlideMenuClassNames {
  /** <nav> gốc bọc track. */
  root?: string;
  /** Div track trượt ngang (translateX theo depth). */
  track?: string;
  /** Div 1 trang cấp. */
  page?: string;
  /** Nút back (chevron + nhãn cấp cha). */
  back?: string;
  /** <li> mỗi item. */
  item?: string;
  /** Button item trong trang. */
  itemButton?: string;
}

export interface SlideMenuProps {
  items: SlideMenuItem[];
  /** Nhãn landmark nav cho screen-reader. */
  ariaLabel?: string;
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: SlideMenuClassNames;
}

/** Đi theo path key → items của trang cấp đó (path rỗng = trang gốc). */
function pageAt(items: SlideMenuItem[], path: string[]): SlideMenuItem[] {
  let level = items;
  for (const key of path) {
    const next = level.find((i) => i.key === key)?.children;
    if (!next) break;
    level = next;
  }
  return level;
}

export function SlideMenu(props: SlideMenuProps) {
  const { items, ariaLabel, className, style } = props;
  const slots = props.classNames;
  // path = chuỗi key từ gốc xuống cấp hiện tại — depth quyết định số trang + khoảng trượt.
  const [path, setPath] = useState<string[]>([]);
  const depth = path.length;

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Escape' && depth > 0) {
      e.preventDefault();
      setPath((p) => p.slice(0, -1));
    }
  }

  // Trang cấp k: root (k=0) rồi lần lượt đi theo path.
  const pages: SlideMenuItem[][] = [items];
  for (let k = 1; k <= depth; k++) pages.push(pageAt(items, path.slice(0, k)));

  return (
    <nav
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={classNames('overflow-hidden rounded-xl border border-line bg-s2', slots?.root, className)}
      style={style}
    >
      <div
        data-slide-track
        className={classNames('flex transition-transform duration-200 ease-[var(--ease-enter)]', slots?.track)}
        style={{ transform: `translateX(-${depth * 100}%)` }}
      >
        {pages.map((page, k) => (
          <div key={k} className={classNames('w-full shrink-0', slots?.page)} inert={k !== depth || undefined} aria-hidden={k !== depth}>
            {k > 0 && (
              <button
                type="button"
                data-slide-back
                onClick={() => setPath((p) => p.slice(0, -1))}
                className={classNames('flex w-full cursor-pointer items-center gap-1.5 border-b border-line2 bg-transparent px-3 py-2 text-left text-label font-medium text-ink2 transition-colors hover:bg-s3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/40', slots?.back)}
              >
                <Icon name="chevron-left" size={14} aria-hidden />
                {items.length > 0 && pageAt(items, path.slice(0, k - 1)).find((i) => i.key === path[k - 1])?.label}
              </button>
            )}
            <ul role="menu" className="m-0 list-none p-1">
              {page.map((item) => (
                <li key={item.key} className={slots?.item}>
                  <button
                    type="button"
                    role="menuitem"
                    aria-haspopup={item.children ? 'menu' : undefined}
                    onClick={() => {
                      if (item.children) setPath((p) => [...p, item.key]);
                      else item.onClick?.();
                    }}
                    className={classNames(
                      'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-3 py-2 text-left text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                      item.danger ? 'text-st-fail hover:bg-st-fail/12' : 'text-ink hover:bg-s3',
                      slots?.itemButton,
                    )}
                  >
                    {item.icon}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.children && <Icon name="chevron-right" size={14} aria-hidden className="text-ink3" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
