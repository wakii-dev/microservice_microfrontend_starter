// Kanban tests — controlled board: mọi move đều qua onCardMove (consumer sở hữu
// state). dataTransfer stub giữ payload giữa dragStart → drop (jsdom không có
// DragEvent thật). Mouse drop test trên slot DropZone (cha của [data-drag-id]).
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KanbanBoard, type KanbanColumnData } from './index.js';

afterEach(cleanup);

/** Live region không role=status (trùng Badge) — query qua aria-live. */
const liveRegion = () => document.querySelector('[aria-live="polite"]') as HTMLElement;

function makeDt() {
  const store = new Map<string, string>();
  return {
    types: [...store.keys()],
    setData: (t: string, v: string) => store.set(t, v),
    getData: (t: string) => store.get(t) ?? '',
    effectAllowed: 'all',
    dropEffect: 'all',
  };
}

const COLS: KanbanColumnData[] = [
  {
    key: 'a',
    title: 'Todo',
    cards: [
      { key: 't1', title: 'Task 1' },
      { key: 't2', title: 'Task 2' },
    ],
  },
  { key: 'b', title: 'Doing', cards: [{ key: 't3', title: 'Task 3' }] },
];

/** fire dragStart trên card → drop vào slot CHỨA card target (chèn trước target). */
function dragTo(targetKey: string, ontoTitle: string) {
  const dt = makeDt();
  const card = document.querySelector(`[data-drag-id="${targetKey}"]`) as HTMLElement;
  fireEvent.dragStart(card, { dataTransfer: dt });
  const onto = screen.getByText(ontoTitle).closest('[data-drag-id]') as HTMLElement;
  fireEvent.drop(onto.parentElement as HTMLElement, { dataTransfer: dt });
}

/** fire dragStart trên card → drop vào vùng trống cột (append). */
function dragToColumn(targetKey: string, colTitle: string) {
  const dt = makeDt();
  const card = document.querySelector(`[data-drag-id="${targetKey}"]`) as HTMLElement;
  fireEvent.dragStart(card, { dataTransfer: dt });
  fireEvent.drop(screen.getByRole('group', { name: colTitle }), { dataTransfer: dt });
}

describe('KanbanBoard render', () => {
  it('render cột + card + count badge', () => {
    render(<KanbanBoard columns={COLS} />);
    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('Doing')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // badge cột Todo
    expect(screen.getByText('1')).toBeInTheDocument(); // badge cột Doing
  });

  it('wipLimit hiển thị n/limit trên badge', () => {
    render(
      <KanbanBoard
        columns={[{ key: 'a', title: 'Todo', wipLimit: 3, cards: COLS[0].cards }]}
      />,
    );
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('cột rỗng → EmptyState "Kéo thẻ vào đây"', () => {
    render(<KanbanBoard columns={[{ key: 'a', title: 'Todo', cards: [] }]} />);
    expect(screen.getByText('Kéo thẻ vào đây')).toBeInTheDocument();
  });

  it('renderCard slot — custom content, vẫn bọc Draggable + drop zone', () => {
    render(
      <KanbanBoard
        columns={COLS}
        renderCard={(c) => <div data-testid={`custom-${c.key}`}>custom {c.title}</div>}
      />,
    );
    expect(screen.getByTestId('custom-t1')).toHaveTextContent('custom Task 1');
    expect(screen.getByTestId('custom-t1').closest('[data-drag-id="t1"]')).not.toBeNull();
  });
});

describe('KanbanBoard move (mouse DnD)', () => {
  it('cross-column: drop vào slot cột khác → onCardMove(key, from, to, toIndex)', () => {
    const onCardMove = vi.fn();
    render(<KanbanBoard columns={COLS} onCardMove={onCardMove} />);
    dragTo('t1', 'Task 3'); // chèn trước Task 3 → index 0 cột Doing
    expect(onCardMove).toHaveBeenCalledWith('t1', 'a', 'b', 0);
  });

  it('reorder trong cột: drop t1 vào slot t3 → toIndex sau remove', () => {
    const onCardMove = vi.fn();
    render(
      <KanbanBoard
        columns={[
          {
            key: 'a',
            title: 'Todo',
            cards: [
              { key: 't1', title: 'Task 1' },
              { key: 't2', title: 'Task 2' },
              { key: 't3', title: 'Task 3' },
            ],
          },
        ]}
        onCardMove={onCardMove}
      />,
    );
    dragTo('t1', 'Task 3'); // insertIdx 2 > fromIdx 0 → toIndex 1
    expect(onCardMove).toHaveBeenCalledWith('t1', 'a', 'a', 1);
  });

  it('append: drop vào vùng trống cột → toIndex = length', () => {
    const onCardMove = vi.fn();
    render(<KanbanBoard columns={COLS} onCardMove={onCardMove} />);
    dragToColumn('t1', 'Doing'); // Doing có 1 card → toIndex 1
    expect(onCardMove).toHaveBeenCalledWith('t1', 'a', 'b', 1);
  });

  it('drop đúng slot cũ → no-op, không bắn onCardMove', () => {
    const onCardMove = vi.fn();
    render(<KanbanBoard columns={COLS} onCardMove={onCardMove} />);
    dragTo('t1', 'Task 1'); // chính nó
    dragTo('t1', 'Task 2'); // slot kế tiếp = cùng vị trí sau remove
    expect(onCardMove).not.toHaveBeenCalled();
  });

  it('WIP đạt limit: từ chối drop từ cột khác + aria-live báo từ chối', () => {
    const onCardMove = vi.fn();
    render(
      <KanbanBoard
        columns={[
          { key: 'a', title: 'Todo', cards: COLS[0].cards },
          { key: 'b', title: 'Doing', wipLimit: 1, cards: COLS[1].cards }, // đầy
        ]}
        onCardMove={onCardMove}
      />
    );
    dragTo('t1', 'Task 3');
    expect(onCardMove).not.toHaveBeenCalled();
    expect(liveRegion()).toHaveTextContent('giới hạn WIP (1/1)');
  });

  it('WIP đầy vẫn cho reorder TRONG cột (count không đổi)', () => {
    const onCardMove = vi.fn();
    render(
      <KanbanBoard
        columns={[
          {
            key: 'a',
            title: 'Todo',
            wipLimit: 3,
            cards: [
              { key: 't1', title: 'Task 1' },
              { key: 't2', title: 'Task 2' },
              { key: 't3', title: 'Task 3' },
            ],
          },
        ]}
        onCardMove={onCardMove}
      />,
    );
    dragTo('t1', 'Task 3');
    expect(onCardMove).toHaveBeenCalledWith('t1', 'a', 'a', 1);
  });

  it('move thành công → aria-live "Đã chuyển … tới cột …, vị trí …"', () => {
    render(<KanbanBoard columns={COLS} onCardMove={vi.fn()} />);
    dragTo('t1', 'Task 3');
    expect(liveRegion()).toHaveTextContent('Đã chuyển "Task 1" tới cột "Doing", vị trí 1.');
  });
});

describe('KanbanBoard keyboard', () => {
  it('Space nhặt → ArrowRight đổi cột → Enter thả → onCardMove + aria-live', async () => {
    const user = userEvent.setup();
    const onCardMove = vi.fn();
    render(<KanbanBoard columns={COLS} onCardMove={onCardMove} />);
    await user.tab(); // card đầu (t1)
    await user.keyboard('{Space}');
    expect(screen.getByRole('button', { name: 'Task 1', pressed: true })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}'); // sang cột Doing
    await user.keyboard('{Enter}');
    expect(onCardMove).toHaveBeenCalledWith('t1', 'a', 'b', 0);
    expect(liveRegion()).toHaveTextContent('Đã chuyển "Task 1" tới cột "Doing", vị trí 1.');
    expect(screen.getByRole('button', { name: 'Task 1', pressed: false })).toBeInTheDocument();
  });

  it('Space → ArrowDown đổi vị trí trong cột → Enter', async () => {
    const user = userEvent.setup();
    const onCardMove = vi.fn();
    render(
      <KanbanBoard
        columns={[
          {
            key: 'a',
            title: 'Todo',
            cards: [
              { key: 't1', title: 'Task 1' },
              { key: 't2', title: 'Task 2' },
              { key: 't3', title: 'Task 3' },
            ],
          },
        ]}
        onCardMove={onCardMove}
      />,
    );
    await user.tab();
    await user.keyboard('{Space}');
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}'); // index 3 = append cuối
    await user.keyboard('{Enter}');
    expect(onCardMove).toHaveBeenCalledWith('t1', 'a', 'a', 2);
  });

  it('Esc hủy — Enter sau đó không bắn onCardMove', async () => {
    const user = userEvent.setup();
    const onCardMove = vi.fn();
    render(<KanbanBoard columns={COLS} onCardMove={onCardMove} />);
    await user.tab();
    await user.keyboard('{Space}');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'Task 1', pressed: false })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onCardMove).not.toHaveBeenCalled();
  });
});
