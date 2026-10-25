// Anchor tests — render items (kể cả nested), scroll-spy active, click scroll mượt
// (preventDefault + scrollTo smooth), onClick callback, offsetTop threshold,
// affix sticky, getContainer element. Rect của section stub được để mô phỏng cuộn.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Anchor, type AnchorLinkItem } from './index.js';

/** Mount 1 section thật vào body với top viewport điều khiển được qua map. */
function mountSection(id: string, tops: Map<string, number>) {
  const el = document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  vi.spyOn(el, 'getBoundingClientRect').mockImplementation(
    () =>
      ({
        top: tops.get(id) ?? 0,
        bottom: (tops.get(id) ?? 0) + 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: tops.get(id) ?? 0,
        toJSON: () => ({}),
      }) as DOMRect,
  );
  return el;
}

function fireScroll(target: Window | HTMLElement = window) {
  act(() => {
    target.dispatchEvent(new Event('scroll'));
  });
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const ITEMS: AnchorLinkItem[] = [
  { key: 'intro', href: '#anchor-intro', title: 'Introduction' },
  { key: 'usage', href: '#anchor-usage', title: 'Usage' },
  { key: 'api', href: '#anchor-api', title: 'API reference' },
];

describe('Anchor', () => {
  it('render items → link đúng title + href trong nav landmark', () => {
    const tops = new Map<string, number>([['anchor-intro', 400], ['anchor-usage', 800], ['anchor-api', 1200]]);
    mountSection('anchor-intro', tops);
    mountSection('anchor-usage', tops);
    mountSection('anchor-api', tops);
    const { getByRole, getByText } = render(<Anchor items={ITEMS} />);

    const nav = getByRole('navigation', { name: 'Table of contents' });
    expect(nav).toBeInTheDocument();
    for (const item of ITEMS) {
      const link = getByText(item.title as string);
      expect(link).toHaveAttribute('href', item.href);
    }
    // Chưa section nào chạm offsetTop → không link nào active
    expect(document.querySelector('[aria-current]')).toBeNull();
  });

  it('nested children → link con render lồng trong cha', () => {
    const tops = new Map<string, number>([['anchor-guide', 400], ['anchor-install', 900]]);
    mountSection('anchor-guide', tops);
    mountSection('anchor-install', tops);
    const { getByText } = render(
      <Anchor
        items={[
          {
            key: 'guide',
            href: '#anchor-guide',
            title: 'Guide',
            children: [{ key: 'install', href: '#anchor-install', title: 'Installation' }],
          },
        ]}
      />,
    );
    expect(getByText('Guide')).toHaveAttribute('href', '#anchor-guide');
    expect(getByText('Installation')).toHaveAttribute('href', '#anchor-install');
  });

  it('scroll-spy: section chạm offsetTop → aria-current; cuộn tiếp → chuyển link sau', () => {
    const tops = new Map<string, number>([['anchor-intro', 400], ['anchor-usage', 800], ['anchor-api', 1200]]);
    mountSection('anchor-intro', tops);
    mountSection('anchor-usage', tops);
    mountSection('anchor-api', tops);
    const { getByText } = render(<Anchor items={ITEMS} />);

    tops.set('anchor-intro', 0); // cuộn tới section 1
    fireScroll();
    expect(getByText('Introduction')).toHaveAttribute('aria-current', 'true');

    tops.set('anchor-usage', 0); // cuộn tiếp sang section 2
    fireScroll();
    expect(getByText('Introduction')).not.toHaveAttribute('aria-current');
    expect(getByText('Usage')).toHaveAttribute('aria-current', 'true');
  });

  it('offsetTop threshold: top 8px chưa active với offsetTop mặc định; đặt offsetTop 10 → active', () => {
    const tops = new Map<string, number>([['anchor-intro', 8]]);
    mountSection('anchor-intro', tops);
    const { getByText, rerender } = render(<Anchor items={ITEMS} />);
    fireScroll();
    expect(getByText('Introduction')).not.toHaveAttribute('aria-current');

    rerender(<Anchor items={ITEMS} offsetTop={10} />);
    expect(getByText('Introduction')).toHaveAttribute('aria-current', 'true');
  });

  it('click → preventDefault + window.scrollTo smooth tới (rect.top + scrollY - offsetTop)', () => {
    const tops = new Map<string, number>([['anchor-usage', 200]]);
    mountSection('anchor-intro', tops);
    mountSection('anchor-usage', tops);
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { getByText } = render(<Anchor items={ITEMS} offsetTop={10} />);

    let docPrevented: boolean | undefined;
    document.addEventListener('click', (e) => {
      docPrevented = e.defaultPrevented;
    });
    fireEvent.click(getByText('Usage'));

    expect(docPrevented).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith({ top: 190, behavior: 'smooth' }); // 200 + 0 - 10
  });

  it('onClick callback nhận (native event, link {href, title}) trước khi cuộn', () => {
    const tops = new Map<string, number>([['anchor-intro', 100]]);
    mountSection('anchor-intro', tops);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const onClick = vi.fn();
    const { getByText } = render(<Anchor items={ITEMS} onClick={onClick} />);

    fireEvent.click(getByText('Introduction'));
    expect(onClick).toHaveBeenCalledTimes(1);
    const [, link] = onClick.mock.calls[0];
    expect(link.href).toBe('#anchor-intro');
    expect(link.title).toBe('Introduction');
  });

  it('affix → wrapper sticky top = offsetTop; không affix → nav là root, không wrapper', () => {
    const tops = new Map<string, number>([['anchor-intro', 100]]);
    mountSection('anchor-intro', tops);
    const { container, rerender } = render(<Anchor items={ITEMS} affix offsetTop={24} className="w-56" />);

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.position).toBe('sticky');
    expect(wrapper.style.top).toBe('24px');
    expect(wrapper).toHaveClass('w-56');
    expect(wrapper.firstElementChild!.tagName).toBe('NAV');

    rerender(<Anchor items={ITEMS} />);
    expect(container.firstElementChild!.tagName).toBe('NAV');
  });

  it('getContainer element → scroll event trên container + scrollTo trên chính container', () => {
    const tops = new Map<string, number>([['anchor-intro', 300]]);
    mountSection('anchor-intro', tops);
    const scrollContainer = document.createElement('div');
    document.body.appendChild(scrollContainer);
    const containerScrollTo = vi.fn();
    (scrollContainer as HTMLElement & { scrollTo: unknown }).scrollTo = containerScrollTo;

    const { getByText } = render(
      <Anchor items={ITEMS} offsetTop={0} getContainer={() => scrollContainer} />,
    );
    // Section top 300 chưa active — element container cũng cập nhật active qua scroll event riêng
    fireScroll(scrollContainer);
    expect(getByText('Introduction')).not.toHaveAttribute('aria-current');

    tops.set('anchor-intro', 0);
    fireScroll(scrollContainer);
    expect(getByText('Introduction')).toHaveAttribute('aria-current', 'true');

    fireEvent.click(getByText('Introduction'));
    expect(containerScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('section chưa mount (href không khớp id nào) → spy bỏ qua, không vỡ', () => {
    const tops = new Map<string, number>([['anchor-intro', 0]]);
    mountSection('anchor-intro', tops);
    const { getByText } = render(<Anchor items={ITEMS} />);
    fireScroll();
    // #anchor-usage/#anchor-api không có section → active rơi về section có thật
    expect(getByText('Introduction')).toHaveAttribute('aria-current', 'true');
  });
});
