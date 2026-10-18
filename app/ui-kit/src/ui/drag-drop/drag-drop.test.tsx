// DragDrop tests — dataTransfer là stub object (jsdom không implement DragEvent
// đầy đủ); fireEvent dragStart/dragOver/drop gán dataTransfer vào event.
import { cleanup, fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DRAG_MIME, DragDropProvider, Draggable, DropZone } from './index.js';

afterEach(cleanup);

/** Stub dataTransfer: setData ghi vào store, getData đọc lại — giữ payload giữa dragStart → drop. */
function makeDt(payload?: unknown) {
  const store = new Map<string, string>();
  if (payload !== undefined) store.set(DRAG_MIME, JSON.stringify(payload));
  return {
    types: [...store.keys()],
    setData: (t: string, v: string) => store.set(t, v),
    getData: (t: string) => store.get(t) ?? '',
    effectAllowed: 'all',
    dropEffect: 'all',
  };
}

describe('Draggable', () => {
  it('dragStart → data-dragging + opacity-40 + payload JSON vào dataTransfer; dragEnd xoá state', () => {
    const dt = makeDt();
    const { container } = render(<Draggable data={{ id: 7 }}>card</Draggable>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(el, { dataTransfer: dt });
    expect(el).toHaveAttribute('data-dragging', 'true');
    expect(el).toHaveClass('opacity-40');
    expect(el).toHaveClass('cursor-grabbing');
    expect(dt.getData(DRAG_MIME)).toBe(JSON.stringify({ id: 7 }));
    fireEvent.dragEnd(el, { dataTransfer: dt });
    expect(el).not.toHaveAttribute('data-dragging');
    expect(el).not.toHaveClass('opacity-40');
  });

  it('disabled: draggable="false" (React giữ enumerated attr), dragStart không set payload', () => {
    const dt = makeDt();
    const { container } = render(<Draggable data={1} disabled>locked</Draggable>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute('draggable', 'false');
    expect(el).toHaveClass('cursor-not-allowed');
    fireEvent.dragStart(el, { dataTransfer: dt });
    expect(el).not.toHaveAttribute('data-dragging');
    expect(dt.getData(DRAG_MIME)).toBe('');
  });

  it('handle: dragstart ngoài handle bị cancel — chỉ handle mới kéo thật', () => {
    const dt = makeDt();
    const { container, getByText } = render(
      <Draggable data="x" handle={<span>grip</span>}>
        <p>body</p>
      </Draggable>,
    );
    const el = container.firstElementChild as HTMLElement;
    // target = wrapper (ngoài handle) → cancel
    fireEvent.dragStart(el, { dataTransfer: dt });
    expect(el).not.toHaveAttribute('data-dragging');
    expect(dt.getData(DRAG_MIME)).toBe('');
    // target nằm TRONG handle → kéo được
    fireEvent.dragStart(getByText('grip'), { dataTransfer: dt });
    expect(el).toHaveAttribute('data-dragging', 'true');
    expect(dt.getData(DRAG_MIME)).toBe(JSON.stringify('x'));
  });
});

describe('DropZone', () => {
  it('dragOver → highlight ring accent; dragLeave tắt; drop parse payload → onDrop(data, event)', () => {
    const onDrop = vi.fn();
    const { getByRole } = render(
      <DropZone ariaLabel="zone" onDrop={onDrop}>
        <p>here</p>
      </DropZone>,
    );
    const zone = getByRole('group', { name: 'zone' });
    // dragover đọc types — stub phải có payload (dragStart thật luôn set MIME).
    fireEvent.dragOver(zone, { dataTransfer: makeDt({ a: 1 }) });
    expect(zone).toHaveAttribute('data-dnd-over', 'true');
    expect(zone).toHaveClass('ring-accent/40');
    expect(zone).toHaveClass('bg-accent/10');
    fireEvent.dragLeave(zone, { dataTransfer: makeDt({ a: 1 }), relatedTarget: null });
    expect(zone).not.toHaveAttribute('data-dnd-over');
    fireEvent.drop(zone, { dataTransfer: makeDt({ k: 'v' }) });
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith({ k: 'v' }, expect.anything());
  });

  it('drop không có payload / JSON hỏng → không bắn onDrop', () => {
    const onDrop = vi.fn();
    const { getByRole } = render(
      <DropZone ariaLabel="z2" onDrop={onDrop}>
        x
      </DropZone>,
    );
    const zone = getByRole('group', { name: 'z2' });
    fireEvent.drop(zone, { dataTransfer: makeDt() }); // rỗng
    const broken = makeDt();
    broken.setData(DRAG_MIME, '{not-json'); // JSON hỏng
    fireEvent.drop(zone, { dataTransfer: broken });
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('accept không khớp dataTransfer.types → không highlight', () => {
    const { getByRole } = render(
      <DropZone ariaLabel="picky" accept={['application/other']}>
        x
      </DropZone>,
    );
    const zone = getByRole('group', { name: 'picky' });
    fireEvent.dragOver(zone, { dataTransfer: makeDt() }); // DRAG_MIME ≠ application/other
    expect(zone).not.toHaveAttribute('data-dnd-over');
  });

  it('activeClass thay highlight mặc định khi isOver', () => {
    const { getByRole } = render(
      <DropZone ariaLabel="custom" activeClass="bg-s3 ring-accent">
        x
      </DropZone>,
    );
    const zone = getByRole('group', { name: 'custom' });
    fireEvent.dragOver(zone, { dataTransfer: makeDt({ a: 1 }) });
    expect(zone).toHaveClass('bg-s3');
    expect(zone).not.toHaveClass('bg-accent/10');
  });

  it('drop stopPropagation — zone con xử lý, zone cha không nhân đôi callback', () => {
    const parentDrop = vi.fn();
    const childDrop = vi.fn();
    const { getByRole } = render(
      <DropZone ariaLabel="outer" onDrop={parentDrop}>
        <DropZone ariaLabel="inner" onDrop={childDrop}>
          x
        </DropZone>
      </DropZone>,
    );
    fireEvent.drop(getByRole('group', { name: 'inner' }), { dataTransfer: makeDt({ a: 1 }) });
    expect(childDrop).toHaveBeenCalledTimes(1);
    expect(parentDrop).not.toHaveBeenCalled();
  });
});

describe('Keyboard (DragDropProvider)', () => {
  it('Space nhặt (aria-pressed) → ArrowDown đổi zone active → Enter thả payload vào zone', async () => {
    const user = userEvent.setup();
    const dropB = vi.fn();
    const { container } = render(
      <DragDropProvider>
        <Draggable data={42} dragId="k1">
          card
        </Draggable>
        <DropZone ariaLabel="A">
          <p>a</p>
        </DropZone>
        <DropZone ariaLabel="B" onDrop={dropB}>
          <p>b</p>
        </DropZone>
      </DragDropProvider>,
    );
    const card = container.querySelector('[data-drag-id="k1"]') as HTMLElement;
    await user.tab(); // focus vào Draggable
    expect(card).toHaveFocus();
    await user.keyboard('{Space}');
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card).toHaveAttribute('data-dragging', 'true');
    // zone đầu (A) active ngay khi nhặt
    const groups = () => container.querySelectorAll('[role="group"]');
    expect(groups()[0]).toHaveAttribute('data-dnd-active', 'true');
    expect(container.querySelectorAll('[data-dnd-active="true"]')).toHaveLength(1);
    await user.keyboard('{ArrowDown}'); // sang zone B
    const zoneB = container.querySelectorAll('[role="group"]')[1];
    expect(zoneB).toHaveAttribute('data-dnd-active', 'true');
    await user.keyboard('{Enter}');
    expect(dropB).toHaveBeenCalledWith(42);
    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(card).not.toHaveAttribute('data-dragging');
  });

  it('Esc hủy — sau đó Enter không bắn onDrop', async () => {
    const user = userEvent.setup();
    const onDrop = vi.fn();
    const { container } = render(
      <DragDropProvider>
        <Draggable data="p" dragId="k2">
          card
        </Draggable>
        <DropZone ariaLabel="z" onDrop={onDrop}>
          zone
        </DropZone>
      </DragDropProvider>,
    );
    const card = container.querySelector('[data-drag-id="k2"]') as HTMLElement;
    await user.tab();
    await user.keyboard('{Space}');
    expect(card).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Escape}');
    expect(card).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard('{Enter}');
    expect(onDrop).not.toHaveBeenCalled();
  });

  it('Consumer onKeyDown chạy trước — preventDefault chặn keyboard default', async () => {
    const user = userEvent.setup();
    const onDrop = vi.fn();
    const consumer = vi.fn((e: React.KeyboardEvent) => e.preventDefault());
    const { container } = render(
      <DragDropProvider>
        <Draggable data="p" dragId="k3" onKeyDown={consumer}>
          card
        </Draggable>
        <DropZone ariaLabel="z" onDrop={onDrop}>
          zone
        </DropZone>
      </DragDropProvider>,
    );
    const card = container.querySelector('[data-drag-id="k3"]') as HTMLElement;
    await user.tab();
    await user.keyboard('{Space}');
    expect(consumer).toHaveBeenCalled();
    // default bị chặn → không hề nhặt
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });
});
