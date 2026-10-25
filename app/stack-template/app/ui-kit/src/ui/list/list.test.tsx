// List tests — renderItem/loading skeleton/empty/pagination đổi trang/header-footer/bordered.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { List } from './index.js';

const ITEMS = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta',
  'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu',
];

afterEach(cleanup);

describe('List', () => {
  it('renderItem → role=list + listitem, đủ items đúng thứ tự', () => {
    render(<List items={['A', 'B', 'C']} renderItem={(item) => <span>{item}</span>} />);
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const texts = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(texts).toEqual(['A', 'B', 'C']);
  });

  it('loading → Skeleton thay items (aria-busy, role=status)', () => {
    render(<List items={['A']} renderItem={(item) => <span>{item}</span>} loading />);
    expect(screen.queryByRole('listitem')).toBeNull();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('items rỗng → emptyText qua EmptyState', () => {
    render(<List items={[]} renderItem={() => null} emptyText="Chưa có việc nào" />);
    expect(screen.getByText('Chưa có việc nào')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('items rỗng không emptyText → mặc định "Không có dữ liệu"', () => {
    render(<List items={[]} renderItem={() => null} />);
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
  });

  it('pagination: 12 items × pageSize 5 → 5/5/2 qua đổi trang', async () => {
    const user = userEvent.setup();
    render(<List items={ITEMS} renderItem={(item) => <span>{item}</span>} pagination={{ pageSize: 5 }} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    await user.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('Kappa')).toBeInTheDocument(); // item thứ 10 — cuối trang 2
    await user.click(screen.getByRole('button', { name: 'Trang 3' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('pagination=false → tất cả items, không nav phân trang', () => {
    render(<List items={ITEMS} renderItem={(item) => <span>{item}</span>} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renderItem nhận absolute index khi phân trang (trang 2 bắt đầu 5)', async () => {
    const user = userEvent.setup();
    render(
      <List
        items={ITEMS}
        renderItem={(item, index) => <span>{`${index}:${item}`}</span>}
        pagination={{ pageSize: 5 }}
      />,
    );
    expect(screen.getByText('0:Alpha')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Trang 2' }));
    expect(screen.getByText('5:Zeta')).toBeInTheDocument();
    expect(screen.queryByText('0:Alpha')).toBeNull();
  });

  it('header + footer render đúng vị trí', () => {
    render(
      <List
        items={['A']}
        renderItem={(item) => <span>{item}</span>}
        header="Việc của tôi"
        footer="Tổng 1 việc"
      />,
    );
    expect(screen.getByText('Việc của tôi')).toBeInTheDocument();
    expect(screen.getByText('Tổng 1 việc')).toBeInTheDocument();
  });

  it('bordered → container có viền', () => {
    const { container } = render(
      <List items={['A']} renderItem={(item) => <span>{item}</span>} bordered />,
    );
    expect(container.firstElementChild).toHaveClass('border');
  });

  it('rowKey làm key React (không crash khi data đổi thứ tự)', () => {
    const { rerender } = render(
      <List
        items={[{ id: 'x', t: 'X' }, { id: 'y', t: 'Y' }]}
        renderItem={(i) => <span>{i.t}</span>}
        rowKey={(i) => i.id}
      />,
    );
    rerender(
      <List
        items={[{ id: 'y', t: 'Y' }, { id: 'x', t: 'X' }]}
        renderItem={(i) => <span>{i.t}</span>}
        rowKey={(i) => i.id}
      />,
    );
    const texts = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(texts).toEqual(['Y', 'X']);
  });
});

describe('List — virtual (VirtualScroll integration)', () => {
  const MANY = Array.from({ length: 500 }, (_, i) => i);

  it('virtual=true → chỉ mount window+buffer (15 rows với height 240/itemSize 48), không render 500', () => {
    render(
      <List
        items={MANY}
        renderItem={(i) => <span>Item {i}</span>}
        virtual
        virtualItemSize={48}
        virtualHeight={240}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(15); // ceil(240/48) + 2*5
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 400')).toBeNull();
  });

  it('virtual ưu tiên pagination: 500 items + pageSize 10 vẫn window theo full list', () => {
    render(
      <List
        items={MANY}
        renderItem={(i) => <span>Item {i}</span>}
        virtual
        virtualItemSize={48}
        virtualHeight={240}
        pagination={{ pageSize: 10 }}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(15);
    expect(screen.queryByRole('navigation')).toBeNull(); // Pagination không render
  });

  it('virtual + rowKey → key theo data (scroll window không mất định danh)', () => {
    render(
      <List
        items={['a', 'b', 'c']}
        renderItem={(item) => <span>{item}</span>}
        virtual
        virtualItemSize={48}
        virtualHeight={96}
        rowKey={(item) => `k-${item}`}
      />,
    );
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  it('virtual + items rỗng → vẫn EmptyState như thường', () => {
    render(<List items={[]} renderItem={() => null} virtual emptyText="Trống" />);
    expect(screen.getByText('Trống')).toBeInTheDocument();
  });
});

describe('List — customize (slots wave 3)', () => {
  it('classNames slots đúng element: root/header/item/footer', () => {
    const { container } = render(
      <List
        items={['A', 'B']}
        renderItem={(item) => <span>{item}</span>}
        header="Head"
        footer="Foot"
        classNames={{ root: 'my-root', header: 'my-header', item: 'my-item', footer: 'my-footer' }}
      />,
    );
    expect(container.firstElementChild?.className).toContain('my-root');
    expect(screen.getByText('Head').className).toContain('my-header');
    for (const li of screen.getAllByRole('listitem')) {
      expect(li.className).toContain('my-item');
    }
    expect(screen.getByText('Foot').className).toContain('my-footer');
  });

  it('style passthrough lên div gốc (root)', () => {
    const { container } = render(<List items={['A']} renderItem={(i) => <span>{i}</span>} style={{ padding: 6 }} />);
    expect((container.firstElementChild as HTMLElement).style.padding).toBe('6px');
  });
});
