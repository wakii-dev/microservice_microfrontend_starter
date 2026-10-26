// Breadcrumb — nav phân cấp: items title + href tùy chọn; item cuối = hiện tại
// (plain text, không link); separator '/'.
// slots-wave: classNames root/list/item/link/label/separator + style passthrough.
import classNames from 'classnames';
import type { CSSProperties, ReactNode } from 'react';

export interface BreadcrumbItem {
  title: ReactNode;
  href?: string;
}

/** Slot classes (slots-wave) — merge sau class mặc định (consumer append). */
export interface BreadcrumbClassNames {
  /** <nav> gốc. */
  root?: string;
  /** <ol> danh sách. */
  list?: string;
  /** <li> mỗi item (gồm separator). */
  item?: string;
  /** <a> item có href (không áp item cuối). */
  link?: string;
  /** <span> item cuối / item không href. */
  label?: string;
  /** <span> separator '/'. */
  separator?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Inline style — passthrough lên nav gốc. */
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: BreadcrumbClassNames;
}

export function Breadcrumb(props: BreadcrumbProps) {
  const { items, className, style } = props;
  const slots = props.classNames;
  return (
    <nav aria-label="Breadcrumb" className={classNames('text-body text-ink3', slots?.root, className)} style={style}>
      <ol className={classNames('m-0 flex list-none items-center gap-2 p-0', slots?.list)}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className={classNames('flex items-center gap-2', slots?.item)}>
              {isLast || !item.href ? (
                <span className={classNames(isLast ? 'text-ink' : '', slots?.label)}>{item.title}</span>
              ) : (
                <a href={item.href} className={classNames('rounded-sm text-ink2 no-underline transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40', slots?.link)}>
                  {item.title}
                </a>
              )}
              {!isLast && <span aria-hidden="true" className={slots?.separator}>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
