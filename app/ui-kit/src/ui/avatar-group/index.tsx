// AvatarGroup — antd Avatar.Group: stack overlap (-ml-2 + ring trắng), max →
// pill "+N" (tooltip liệt kê tên bị ẩn), tooltip tên khi hover từng avatar.
// Avatar giữ nguyên — group chỉ wrap. fallback ưu tiên hơn initials suy từ tên.
// slots-wave: classNames {root} + style passthrough — default giữ nguyên DOM.
import classNames from 'classnames';
import type { CSSProperties } from 'react';
import { Avatar } from '../avatar/index';
import { Tooltip } from '../tooltip/index';

export interface AvatarGroupItem {
  src?: string;
  name: string;
  /** Chữ hiển thị khi không có src (mặc định: initials 2 chữ cái đầu). */
  fallback?: string;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface AvatarGroupClassNames {
  /** Div gốc bọc stack avatar. */
  root?: string;
}

export interface AvatarGroupProps {
  /** Danh sách avatar — mỗi item tooltip = name khi hover. */
  items: AvatarGroupItem[];
  /** Số avatar hiển thị tối đa — dư gộp thành pill "+N" (tooltip liệt kê tên ẩn). */
  max?: number;
  /** Kích thước mỗi avatar px (truyền thẳng Avatar.size). */
  size?: number;
  className?: string;
  /** Inline style — passthrough lên div gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: AvatarGroupClassNames;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export function AvatarGroup(props: AvatarGroupProps) {
  const { items, max, size = 32, className, style } = props;
  const slots = props.classNames;
  const visible = max ? items.slice(0, max) : items;
  const hidden = items.slice(visible.length);
  const overlapCls = '-ml-2';

  // Pop-in stagger: delay theo vị trí (literal class list — Tailwind quét được;
  // bước 30ms theo depth contract 24-40ms; vành đai >5 avatar dùng delay cuối —
  // hiếm, overflow +N đã gộp)
  const stagger = ['', '[animation-delay:30ms]', '[animation-delay:60ms]', '[animation-delay:90ms]', '[animation-delay:120ms]'];

  return (
    <div className={classNames('flex items-center', slots?.root, className)} style={style}>
      {visible.map((item, i) => (
        <Tooltip key={`${item.name}-${i}`} title={item.name} className={i > 0 ? overlapCls : undefined}>
          <Avatar
            src={item.src}
            alt={item.name}
            size={size}
            className={`ring-2 ring-s2 animate-[bp-bounce-in_var(--motion-base)_var(--ease-enter)]${stagger[Math.min(i, stagger.length - 1)]}`}
          >
            {item.fallback ?? initials(item.name)}
          </Avatar>
        </Tooltip>
      ))}
      {hidden.length > 0 && (
        <Tooltip title={hidden.map((h) => h.name).join(', ')} className={overlapCls}>
          <Avatar size={size} className="bg-s3 ring-2 ring-s2">
            +{hidden.length}
          </Avatar>
        </Tooltip>
      )}
    </div>
  );
}
