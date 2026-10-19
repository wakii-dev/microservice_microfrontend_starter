// Layout — composition shell kiểu antd: Layout/Header/Content/Footer/Sider.
// Root <section> flex-col (nested Layout tự thành cột trong hàng khi hasSider);
// hasSider: prop THẮNG, thiếu → dò Layout.Sider con trực tiếp (sync lúc render,
// không nhảy layout sau mount — Sider bọc trong Fragment thì truyền hasSider thủ công).
// Sider: zone flex-none, width mirror controlled `collapsed` (đồng bộ collapse
// CỦA <Sidebar> đặt trong children qua onToggle của nó — Sidebar tự giữ trigger
// pill + width 200↔80, Sider chỉ theo kèm nên không double trigger); cấp
// SiderContext cho con cháu (useSiderCollapsed) để label/menu tự co.
// a11y landmark EXPLICIT vì zone nằm trong <section> (implicit role bị scope
// mất): Header role="banner" · Content <main> · Footer role="contentinfo";
// Sider là div zone thuần — landmark complementary do <Sidebar> trong children
// đảm nhiệm (tránh nested <aside> trùng landmark).
// Sticky header z-10 theo idiom Table (sticky in-flow, không thuộc overlay scale
// --z-*); motion: Sider transition width 200ms ease-out (đồng bộ Sidebar).
// Tokens-only: root bg-canvas (colorBgLayout antd), zones bg-s1 — không hex.
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type FunctionComponent,
  type ReactNode,
} from 'react';

export interface LayoutProps {
  /** Ép hàng ngang (Sider trái + khối nội dung phải). Thiếu → tự dò Layout.Sider con trực tiếp. */
  hasSider?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface LayoutHeaderProps {
  /** Bám đỉnh viewport khi cuộn (sticky top-0). */
  sticky?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface LayoutContentProps {
  className?: string;
  children?: ReactNode;
}

export interface LayoutFooterProps {
  className?: string;
  children?: ReactNode;
}

export interface LayoutSiderProps {
  /** Bề ngang zone khi KHÔNG collapsed (mặc định 200 — khớp Sidebar). */
  width?: number | string;
  /** Controlled: true → thu về collapsedWidth. Đồng bộ với Sidebar qua onToggle của nó. */
  collapsed?: boolean;
  /** Bề ngang khi collapsed (mặc định 80 — khớp Sidebar icon-only). */
  collapsedWidth?: number | string;
  className?: string;
  children?: ReactNode;
}

const SiderContext = createContext<{ collapsed: boolean }>({ collapsed: false });

/** collapsed hiện tại của Layout.Sider bao ngoài (false nếu không trong Sider). */
// eslint-disable-next-line react-refresh/only-export-components
export function useSiderCollapsed(): boolean {
  return useContext(SiderContext).collapsed;
}

function LayoutSider({
  width = 200,
  collapsed = false,
  collapsedWidth = 80,
  className,
  children,
}: LayoutSiderProps) {
  return (
    <SiderContext.Provider value={{ collapsed }}>
      <div
        style={{ width: collapsed ? collapsedWidth : width }}
        className={`flex-none overflow-hidden bg-s1 transition-[width] duration-200 ease-out${className ? ` ${className}` : ''}`}
      >
        {children}
      </div>
    </SiderContext.Provider>
  );
}

function LayoutHeader({ sticky = false, className, children }: LayoutHeaderProps) {
  return (
    <header
      role="banner"
      className={`flex h-16 flex-none items-center gap-3 border-b border-line bg-s1 px-4${sticky ? ' sticky top-0 z-10' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </header>
  );
}

function LayoutContent({ className, children }: LayoutContentProps) {
  return (
    <main
      role="main"
      className={`flex min-h-0 flex-auto flex-col${className ? ` ${className}` : ''}`}
    >
      {children}
    </main>
  );
}

function LayoutFooter({ className, children }: LayoutFooterProps) {
  return (
    <footer
      role="contentinfo"
      className={`flex flex-none items-center justify-center border-t border-line bg-s1 px-4 py-5 text-center text-meta text-ink3${className ? ` ${className}` : ''}`}
    >
      {children}
    </footer>
  );
}

export interface LayoutComponent extends FunctionComponent<LayoutProps> {
  Header: FunctionComponent<LayoutHeaderProps>;
  Content: FunctionComponent<LayoutContentProps>;
  Footer: FunctionComponent<LayoutFooterProps>;
  Sider: FunctionComponent<LayoutSiderProps>;
}

export const Layout = (({ hasSider, className, children }: LayoutProps) => {
  // Auto-detect Sider con TRỰC TIẾP (đồng bộ lúc render); prop hasSider thắng.
  const detectSider = Children.toArray(children).some(
    (child) => isValidElement(child) && child.type === LayoutSider,
  );
  const row = hasSider ?? detectSider;
  return (
    <section
      className={`flex min-h-0 flex-auto bg-canvas ${row ? 'flex-row' : 'flex-col'}${className ? ` ${className}` : ''}`}
    >
      {children}
    </section>
  );
}) as LayoutComponent;

Layout.Header = LayoutHeader;
Layout.Content = LayoutContent;
Layout.Footer = LayoutFooter;
Layout.Sider = LayoutSider;
