// Breadcrumb — nav phân cấp: items title + href tùy chọn; item cuối = hiện tại
// (plain text, không link); separator '/'.
import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  title: ReactNode;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`text-body text-ink3${className ? ` ${className}` : ''}`}>
      <ol className="m-0 flex list-none items-center gap-2 p-0">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {isLast || !item.href ? (
                <span className={isLast ? 'text-ink' : ''}>{item.title}</span>
              ) : (
                <a href={item.href} className="text-ink2 no-underline transition-colors hover:text-accent">
                  {item.title}
                </a>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
