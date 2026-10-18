// Menu — antd parity: items đệ quy { key, label, icon?, children?, disabled? },
// submenu lồng không giới hạn cấp; mode vertical (inline expand) | horizontal
// (dropdown/flyout). Ngôn ngữ nút design-system: item thường transparent +
// hover:bg-s3, selected = nền accent đặc + chữ trắng font-medium (pagination/
// calendar), disabled = text-ink4 không hover. Motion CSS thuần: expand/collapse
// animate grid-template-rows 0fr→1fr + opacity (không JS đo chiều cao).
// a11y: role menu/menuitem, aria-expanded, aria-haspopup, aria-current='true'.
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../icons/index.js';

export interface MenuItemData {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: MenuItemData[];
  disabled?: boolean;
}

export interface MenuProps {
  items: MenuItemData[];
  mode?: 'vertical' | 'horizontal';
  selectedKey?: string;
  onSelect?: (key: string) => void;
  className?: string;
}

/** Sidebar collapsed → Menu icon-only (label fade). Sidebar set qua provider. */
export const MenuCompactContext = createContext(false);

function ChevronRightIcon() {
  return <Icon name="chevron-right" size={12} />;
}
function ChevronDownIcon() {
  return <Icon name="chevron-down" size={12} />;
}

/* Ngôn ngữ nút — khớp pagination/calendar: transparent+hover s3 / accent fill /
 * ink4 disabled. 3 biến thể viết tường minh (không ghép chuỗi kiểu surgery). */
const ITEM_NORMAL =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-3 py-1.5 text-body text-ink transition-colors hover:bg-s3';
const ITEM_SELECTED =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-accent px-3 py-1.5 text-body font-medium text-white transition-colors hover:bg-accent';
const ITEM_DISABLED =
  'flex w-full cursor-not-allowed items-center gap-2 rounded-lg border-none bg-transparent px-3 py-1.5 text-body text-ink4';

/** Đường đi các key submenu cha của selectedKey (không gồm leaf) — auto-open lần đầu. */
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
}

function MenuLevel({ items, mode, depth, ulCls, selectedKey, onSelect, openKeys, toggle }: LevelProps) {
  const compact = useContext(MenuCompactContext);
  const vertical = mode === 'vertical';

  return (
    <ul role="menu" aria-orientation={vertical ? 'vertical' : 'horizontal'} className={`m-0 list-none p-0 ${ulCls}`}>
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
          <li role="none" key={item.key} className="relative">
            {hasChildren ? (
              <button
                type="button"
                role="menuitem"
                aria-haspopup="true"
                aria-expanded={open}
                disabled={item.disabled}
                className={item.disabled ? ITEM_DISABLED : ITEM_NORMAL}
                onClick={() => !item.disabled && toggle(item.key)}
              >
                {item.icon && (
                  <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center text-base leading-none">
                    {item.icon}
                  </span>
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
                className={item.disabled ? ITEM_DISABLED : selected ? ITEM_SELECTED : ITEM_NORMAL}
                onClick={() => {
                  if (item.disabled) return;
                  onSelect?.(item.key);
                }}
              >
                {item.icon && (
                  <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center text-base leading-none">
                    {item.icon}
                  </span>
                )}
                {label}
              </button>
            )}

            {hasChildren && vertical && (
              /* Expand/collapse CSS thuần: grid-template-rows 0fr→1fr + opacity. */
              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${
                  open ? '[grid-template-rows:1fr] opacity-100' : '[grid-template-rows:0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <MenuLevel
                    items={item.children!}
                    mode={mode}
                    depth={depth + 1}
                    ulCls="ml-4 flex flex-col gap-1"
                    selectedKey={selectedKey}
                    onSelect={onSelect}
                    openKeys={openKeys}
                    toggle={toggle}
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
                ulCls={`absolute z-30 flex flex-col gap-1 rounded-lg border border-line bg-s2 p-1 shadow-[var(--shadow-pop)] ${
                  depth === 0 ? 'left-0 top-full min-w-[180px]' : 'left-full top-0 min-w-[160px]'
                }`}
                selectedKey={selectedKey}
                onSelect={onSelect}
                openKeys={openKeys}
                toggle={toggle}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function Menu({ items, mode = 'vertical', selectedKey, onSelect, className }: MenuProps) {
  /* Auto-open lần đầu: nhánh chứa selectedKey mở sẵn (useState initializer — chạy 1 lần). */
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
    <nav className={className}>
      <MenuLevel
        items={items}
        mode={mode}
        depth={0}
        ulCls={mode === 'horizontal' ? 'flex items-center gap-1' : 'flex flex-col gap-1'}
        selectedKey={selectedKey}
        onSelect={handleSelect}
        openKeys={openKeys}
        toggle={toggle}
      />
    </nav>
  );
}
