// Menu — antd parity: items đệ quy { key, label, icon?, children?, disabled? },
// submenu lồng không giới hạn cấp; mode vertical (inline expand) | horizontal
// (dropdown/flyout). Ngôn ngữ nút design-system: item thường transparent +
// hover:bg-s3, selected = nền accent đặc + chữ trắng font-medium (pagination/
// calendar), disabled = text-ink4 không hover. Motion CSS thuần: expand/collapse
// animate grid-template-rows 0fr→1fr + opacity (không JS đo chiều cao).
// a11y: role menu/menuitem, aria-expanded, aria-haspopup, aria-current='true'.
import classNames from 'classnames';
import { createContext, useContext, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface MenuItemData {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: MenuItemData[];
  disabled?: boolean;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface MenuClassNames {
  /** <nav> gốc bọc menu. */
  root?: string;
  /** <ul role="menu"> — áp cho mọi cấp (root + submenu). */
  list?: string;
  /** <li> mỗi item. */
  item?: string;
  /** <button role="menuitem"> — áp cả item lá lẫn trigger submenu. */
  itemButton?: string;
}

export interface MenuProps {
  items: MenuItemData[];
  mode?: 'vertical' | 'horizontal';
  selectedKey?: string;
  onSelect?: (key: string) => void;
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: MenuClassNames;
}

/** Sidebar collapsed → Menu icon-only (label fade). Sidebar set qua provider. */
// Context + util là public API có chủ đích (fast-refresh warning chấp nhận)
// eslint-disable-next-line react-refresh/only-export-components
export const MenuCompactContext = createContext(false);

function ChevronRightIcon() {
  return <Icon name="chevron-right" size={12} />;
}
function ChevronDownIcon() {
  return <Icon name="chevron-down" size={12} />;
}

/* Ngôn ngữ nút — khớp pagination/calendar: transparent+hover s3 / accent fill /
 * ink4 disabled. 3 biến thể viết tường minh (không ghép chuỗi kiểu surgery).
 * Compact (sidebar icon-only, fix phản hồi user 2026-10-18): item = Ô VUÔNG
 * size-8 như antd sider thu gọn; căn giữa cột do UL (items-center) + LI
 * (flex-col items-center) lo — KHÔNG dùng mx-auto (class mới có thể chưa vào
 * CSS build của consumer; chỉ dùng class đã tồn tại từ batch trước). */
function itemCls(kind: 'normal' | 'selected' | 'disabled', compact: boolean): string {
  const base = 'flex items-center rounded-lg border-none text-body transition-colors';
  const fit = compact ? 'size-8 justify-center px-0' : 'w-full cursor-pointer gap-2 px-3 py-1.5';
  if (kind === 'disabled') return `${base} cursor-not-allowed bg-transparent text-ink4 ${fit}`;
  if (kind === 'selected') return `${base} cursor-pointer bg-accent font-medium text-white hover:bg-accent ${fit}`;
  return `${base} cursor-pointer bg-transparent text-ink hover:bg-s3 ${fit}`;
}

/** Đường đi các key submenu cha của selectedKey (không gồm leaf) — auto-open lần đầu. */
// eslint-disable-next-line react-refresh/only-export-components
export function findPath(items: MenuItemData[], selected?: string, trail: string[] = []): string[] | null {
  if (!selected) return null;
  for (const item of items) {
    if (item.key === selected) return trail;
    if (item.children) {
      const found = findPath(item.children, selected, [...trail, item.key]);
      if (found) return found;
    }
  }
  return null;
}

interface LevelProps {
  items: MenuItemData[];
  mode: 'vertical' | 'horizontal';
  depth: number;
  ulCls: string;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  openKeys: Set<string>;
  toggle: (key: string) => void;
  slots?: MenuClassNames;
}

function MenuLevel(props: LevelProps) {
  const { items, mode, depth, ulCls, selectedKey, onSelect, openKeys, toggle, slots } = props;
  const compact = useContext(MenuCompactContext);
  const vertical = mode === 'vertical';

  return (
    <ul
      role="menu"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      className={classNames('m-0 list-none p-0', ulCls, slots?.list)}
    >
      {items.map((item) => {
        const hasChildren = !!item.children?.length;
        const open = openKeys.has(item.key);
        const selected = item.key === selectedKey;

        const label = (
          <span
            className={`min-w-0 truncate text-left transition-[width,opacity] duration-200 ${
              compact ? 'w-0 opacity-0' : 'flex-1 opacity-100'
            }`}
          >
            {item.label}
          </span>
        );


        return (
          <li
            role="none"
            key={item.key}
            className={classNames('relative', compact && 'flex flex-col items-center', slots?.item)}
          >
            {hasChildren ? (
              <button
                type="button"
                role="menuitem"
                aria-expanded={open}
                aria-haspopup="menu"
                disabled={item.disabled}
                className={classNames(itemCls(item.disabled ? 'disabled' : 'normal', compact), slots?.itemButton)}
                onClick={() => !item.disabled && toggle(item.key)}
              >
                {item.icon ? (
                  <span aria-hidden="true" className="relative flex size-4 shrink-0 items-center justify-center text-base leading-none">
                    {item.icon}
                    {/* Compact: chấm nhỏ góc phải icon cha = còn con (fix ⑥-6). */}
                    {compact && (
                      <span aria-hidden="true" className="absolute -bottom-1 -right-1 size-1 rounded-full bg-ink3" />
                    )}
                  </span>
                ) : (
                  compact && (
                    <span aria-hidden="true" className="relative flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold leading-none">
                      {typeof item.label === 'string' ? item.label.trim().charAt(0).toUpperCase() : '•'}
                      <span aria-hidden="true" className="absolute -bottom-1 -right-1 size-1 rounded-full bg-ink3" />
                    </span>
                  )
                )}
                {label}
                {!compact && (
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-ink3 transition-transform duration-200 ${
                      vertical && open ? 'rotate-90' : ''
                    }`}
                  >
                    {vertical || depth > 0 ? <ChevronRightIcon /> : <ChevronDownIcon />}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                role="menuitem"
                aria-current={selected ? 'true' : undefined}
                disabled={item.disabled}
                className={classNames(itemCls(item.disabled ? 'disabled' : selected ? 'selected' : 'normal', compact), slots?.itemButton)}
                onClick={() => {
                  if (item.disabled) return;
                  onSelect?.(item.key);
                }}
              >
                {item.icon ? (
                  <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center text-base leading-none">
                    {item.icon}
                  </span>
                ) : (
                  compact && (
                    /* Compact không có icon → chữ cái đầu làm đại diện (ô vuông
                     * không được trống — mọi icon thẳng hàng cột, yêu cầu user). */
                    <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold leading-none">
                      {typeof item.label === 'string' ? item.label.trim().charAt(0).toUpperCase() : '•'}
                    </span>
                  )
                )}
                {label}
              </button>
            )}

            {hasChildren && vertical && (
              /* Expand/collapse CSS thuần: grid-template-rows 0fr→1fr + opacity.
               * Compact (user 2026-10-18): con ẪN mặc định như thường, bấm cha
               * mở ra — nhưng KHÔNG indent ml-4, icon con thẳng cột icon cha. */
              <div
                className={`grid min-h-0 overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
                  open ? '[grid-template-rows:1fr] opacity-100' : '[grid-template-rows:0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <MenuLevel
                    items={item.children!}
                    mode={mode}
                    depth={depth + 1}
                    ulCls={compact ? 'flex flex-col items-center gap-1' : 'ml-4 flex flex-col gap-1'}
                    selectedKey={selectedKey}
                    onSelect={onSelect}
                    openKeys={openKeys}
                    toggle={toggle}
                    slots={slots}
                  />
                </div>
              </div>
            )}

            {hasChildren && !vertical && open && (
              /* Horizontal: depth 0 = dropdown bên dưới; sâu hơn = flyout bên phải. */
              <MenuLevel
                items={item.children!}
                mode={mode}
                depth={depth + 1}
                ulCls={`absolute z-[var(--z-popover)] origin-top-left flex flex-col gap-1 rounded-lg border border-line bg-s2 p-1 shadow-[var(--shadow-pop)] animate-[bp-zoom-in_var(--motion-fast)_var(--ease-enter)] ${
                  depth === 0 ? 'left-0 top-full min-w-[180px]' : 'left-full top-0 min-w-[160px]'
                }`}
                selectedKey={selectedKey}
                onSelect={onSelect}
                openKeys={openKeys}
                toggle={toggle}
                slots={slots}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Menu(props: MenuProps) {
  const { items, mode = 'vertical', selectedKey, onSelect, className, style } = props;
  const slots = props.classNames;
  /* Auto-open lần đầu: nhánh chứa selectedKey mở sẵn (useState initializer — chạy 1 lần). */
  const compact = useContext(MenuCompactContext);
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(findPath(items, selectedKey) ?? []));

  const toggle = (key: string) =>
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleSelect = (key: string) => {
    onSelect?.(key);
    if (mode === 'horizontal') setOpenKeys(new Set()); // chọn xong đóng dropdown như antd
  };

  return (
    <nav className={classNames(slots?.root, className)} style={style}>
      <MenuLevel
        items={items}
        mode={mode}
        depth={0}
        /* Compact: root ul tự items-center — ô vuông icon căn giữa cột bằng
         * flexbox thuần (mx-auto phụ thuộc CSS class có trong build consumer). */
        ulCls={
          mode === 'horizontal'
            ? 'flex items-center gap-1'
            : compact
              ? 'flex flex-col items-center gap-1'
              : 'flex flex-col gap-1'
        }
        selectedKey={selectedKey}
        onSelect={handleSelect}
        openKeys={openKeys}
        toggle={toggle}
        slots={slots}
      />
    </nav>
  );
}
