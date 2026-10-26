// Layout tests — zone render + landmark roles, hasSider (prop + auto-detect),
// header sticky, footer text/classes, Sider width collapsed/default, SiderContext,
// nested Layout vẫn cột trong hàng.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Layout, useSiderCollapsed } from './index.js';

afterEach(cleanup);

describe('Layout — zones & landmark a11y', () => {
  it('render 3 zone với landmark banner/main/contentinfo + children', () => {
    render(
      <Layout>
        <Layout.Header>Wakii Admin</Layout.Header>
        <Layout.Content>
          <p>Nội dung chính</p>
        </Layout.Content>
        <Layout.Footer>© 2026 Wakii</Layout.Footer>
      </Layout>,
    );
    expect(screen.getByRole('banner')).toHaveTextContent('Wakii Admin');
    expect(screen.getByRole('main')).toHaveTextContent('Nội dung chính');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('© 2026 Wakii');
  });

  it('header sticky: sticky=true → sticky top-0 z-10; mặc định không sticky', () => {
    const { rerender } = render(
      <Layout>
        <Layout.Header sticky>H</Layout.Header>
      </Layout>,
    );
    expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0', 'z-10');
    rerender(
      <Layout>
        <Layout.Header>H</Layout.Header>
      </Layout>,
    );
    expect(screen.getByRole('banner')).not.toHaveClass('sticky');
  });

  it('footer: text-meta text-ink3 + border-t zone', () => {
    render(
      <Layout>
        <Layout.Footer>Wakii © 2026</Layout.Footer>
      </Layout>,
    );
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('text-meta', 'text-ink3', 'border-t');
  });
});

describe('Layout — row/col arrangement', () => {
  it('hasSider prop → flex-row; bỏ → flex-col', () => {
    const { container, rerender } = render(<Layout hasSider />);
    expect(container.firstElementChild).toHaveClass('flex-row');
    rerender(<Layout />);
    expect(container.firstElementChild).toHaveClass('flex-col');
    expect(container.firstElementChild).not.toHaveClass('flex-row');
  });

  it('auto-detect Layout.Sider con trực tiếp → row không cần hasSider', () => {
    const { container } = render(
      <Layout>
        <Layout.Sider>
          <span>nav</span>
        </Layout.Sider>
        <Layout>
          <Layout.Content>page</Layout.Content>
        </Layout>
      </Layout>,
    );
    expect(container.firstElementChild).toHaveClass('flex-row');
  });

  it('nested Layout trong row vẫn flex-col (cột header/content)', () => {
    const { container } = render(
      <Layout hasSider>
        <Layout.Sider>S</Layout.Sider>
        <Layout>
          <Layout.Content>C</Layout.Content>
        </Layout>
      </Layout>,
    );
    const inner = screen.getByRole('main').closest('section');
    expect(inner).not.toBeNull();
    expect(inner).not.toBe(container.firstElementChild);
    expect(inner).toHaveClass('flex-col');
    expect(inner).not.toHaveClass('flex-row');
  });
});

describe('Layout.Sider — width + context', () => {
  it('collapsed → width 80px; mặc định 200px; collapsedWidth custom ăn theo', () => {
    const { rerender } = render(
      <Layout hasSider>
        <Layout.Sider>
          <span>nav</span>
        </Layout.Sider>
      </Layout>,
    );
    const sider = () => screen.getByText('nav').closest('div')!;
    expect(sider()).toHaveStyle({ width: '200px' });
    rerender(
      <Layout hasSider>
        <Layout.Sider collapsed>
          <span>nav</span>
        </Layout.Sider>
      </Layout>,
    );
    expect(sider()).toHaveStyle({ width: '80px' });
    rerender(
      <Layout hasSider>
        <Layout.Sider collapsed collapsedWidth={64}>
          <span>nav</span>
        </Layout.Sider>
      </Layout>,
    );
    expect(sider()).toHaveStyle({ width: '64px' });
  });

  it('useSiderCollapsed: con cháu đọc được collapsed và flip theo prop', () => {
    const Probe = () => {
      const collapsed = useSiderCollapsed();
      return <span data-testid="probe">{String(collapsed)}</span>;
    };
    const { rerender } = render(
      <Layout hasSider>
        <Layout.Sider>
          <Probe />
        </Layout.Sider>
      </Layout>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('false');
    rerender(
      <Layout hasSider>
        <Layout.Sider collapsed>
          <Probe />
        </Layout.Sider>
      </Layout>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('true');
  });

  it('Sider ngoài Layout (root zone) vẫn render width — compose standalone', () => {
    render(
      <div>
        <Layout.Sider width={240}>
          <span>standalone</span>
        </Layout.Sider>
      </div>,
    );
    expect(screen.getByText('standalone').closest('div')).toHaveStyle({ width: '240px' });
  });
});

// ── slots-wave: classNames slots + style passthrough ──

describe('Layout — classNames slots + style', () => {
  it('slots lên đúng element: root/header/content/footer/sider', () => {
    const { container } = render(
      <Layout hasSider classNames={{ root: 'slot-layout' }}>
        <Layout.Sider classNames={{ root: 'slot-sider' }}>
          <span>nav</span>
        </Layout.Sider>
        <Layout.Header classNames={{ root: 'slot-header' }}>H</Layout.Header>
        <Layout.Content classNames={{ root: 'slot-content' }}>
          <p>main</p>
        </Layout.Content>
        <Layout.Footer classNames={{ root: 'slot-footer' }}>F</Layout.Footer>
      </Layout>,
    );
    expect(container.firstElementChild).toHaveClass('slot-layout');
    expect(screen.getByText('nav').closest('div')).toHaveClass('slot-sider');
    expect(screen.getByRole('banner')).toHaveClass('slot-header');
    expect(screen.getByRole('main')).toHaveClass('slot-content');
    expect(screen.getByRole('contentinfo')).toHaveClass('slot-footer');
  });

  it('style passthrough + className sau root slot; Sider style override được width', () => {
    render(
      <Layout style={{ minHeight: 480 }} className="user-last" classNames={{ root: 'slot-layout' }}>
        <Layout.Header style={{ background: 'rgb(1, 2, 3)' }}>H</Layout.Header>
        <Layout.Sider style={{ width: 320 }}>
          <span>nav</span>
        </Layout.Sider>
      </Layout>,
    );
    const root = document.querySelector('section.slot-layout') as HTMLElement;
    expect(root).toHaveStyle({ minHeight: '480px' });
    expect(root.className.indexOf('slot-layout')).toBeLessThan(root.className.indexOf('user-last'));
    expect(screen.getByRole('banner')).toHaveStyle({ background: 'rgb(1, 2, 3)' });
    expect(screen.getByText('nav').closest('div')).toHaveStyle({ width: '320px' });
  });
});
