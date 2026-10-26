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

// ── slots-wave: classNames slots + style passthrough ──

describe('DragDrop — classNames + style', () => {
  it('Draggable slots root/handle lên đúng element; DropZone slot root; className sau slot', () => {
    const { container, getByRole } = render(
      <>
        <Draggable
          data="s"
          handle={<span>grip</span>}
          classNames={{ root: 'slot-drag', handle: 'slot-handle' }}
          className="user-last"
        >
          card
        </Draggable>
        <DropZone ariaLabel="z" classNames={{ root: 'slot-zone' }} className="user-zone">
          x
        </DropZone>
      </>,
    );
    const drag = container.querySelector('[role="button"]')!;
    expect(drag).toHaveClass('slot-drag');
    expect(drag.className.indexOf('slot-drag')).toBeLessThan(drag.className.indexOf('user-last'));
    expect(container.querySelector('[data-drag-handle]')).toHaveClass('slot-handle');
    const zone = getByRole('group', { name: 'z' });
    expect(zone).toHaveClass('slot-zone');
    expect(zone.className.indexOf('slot-zone')).toBeLessThan(zone.className.indexOf('user-zone'));
  });

  it('style passthrough lên cả Draggable wrapper + DropZone zone (không phá dnd state)', () => {
    const { container, getByRole } = render(
      <>
        <Draggable data="s" style={{ margin: '8px' }}>card</Draggable>
        <DropZone ariaLabel="z" style={{ padding: '4px' }}>x</DropZone>
      </>,
    );
    expect(container.querySelector('[role="button"]')).toHaveStyle({ margin: '8px' });
    const zone = getByRole('group', { name: 'z' });
    expect(zone).toHaveStyle({ padding: '4px' });
    fireEvent.dragOver(zone, { dataTransfer: makeDt({ a: 1 }) });
    expect(zone).toHaveAttribute('data-dnd-over', 'true');
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

// ═══ Touch pointer fallback (R10) — chỉ khi pointerType=touch, HTML5 path không đổi ═══

function TouchHarness({ onDrop, onDragStart, onDragEnd }: {
  onDrop?: (data: unknown) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div>
      <DropZone ariaLabel="Zone A" onDrop={onDrop}>
        <Draggable
          data={{ id: 'card-1' }}
          dragId="card-1"
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <p>Card touch</p>
        </Draggable>
      </DropZone>
      <DropZone ariaLabel="Zone B" onDrop={onDrop}>
        <p>target B</p>
      </DropZone>
    </div>
  );
}

describe('DragDrop — touch pointer fallback (R10)', () => {
  /** jsdom không có elementFromPoint — gán mock thẳng, trả hàm restore. */
  function mockHitTest(el: Element | null) {
    const fn = vi.fn(() => el);
    (document as unknown as { elementFromPoint?: unknown }).elementFromPoint = fn;
    return () => {
      delete (document as unknown as { elementFromPoint?: unknown }).elementFromPoint;
    };
  }

  it('pointerdown touch → ghost tạo + data-dragging + onDragStart; mouse KHÔNG tạo ghost (HTML5 path giữ nguyên)', () => {
    const onDragStart = vi.fn();
    const { getByText } = render(
      <Draggable data={{ id: 1 }} dragId="t1" onDragStart={onDragStart}>
        <p>card</p>
      </Draggable>,
    );
    const card = getByText('card').parentElement!;
    // mouse → path HTML5: KHÔNG ghost, KHÔNG dragging state
    fireEvent.pointerDown(card, { pointerType: 'mouse' });
    expect(document.querySelector('[data-dnd-ghost]')).toBeNull();
    expect(card.getAttribute('data-dragging')).toBeNull();
    expect(onDragStart).not.toHaveBeenCalled();
    // touch → engine chạy
    fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 10, clientY: 10 });
    expect(document.querySelector('[data-dnd-ghost]')).not.toBeNull();
    expect(card.getAttribute('data-dragging')).toBe('true');
    expect(onDragStart).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(document.body, { clientX: 10, clientY: 10 });
    expect(document.querySelector('[data-dnd-ghost]')).toBeNull();
  });

  it('pointermove → ghost theo pointer (transform cập nhật) + zone hit-test bật data-dnd-touch-over', () => {
    const { getByText } = render(<TouchHarness />);
    const zoneB = getByText('target B').closest('[data-drop-zone]')!;
    const card = getByText('Card touch').parentElement!;
    const restore = mockHitTest(zoneB.querySelector('p'));
    try {
      fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 5, clientY: 5 });
      fireEvent.pointerMove(window, { clientX: 60, clientY: 25 });
      const ghost = document.querySelector('[data-dnd-ghost]') as HTMLElement;
      expect(ghost.style.transform).toContain('translate3d(55px, 20px');
      expect(zoneB.getAttribute('data-dnd-touch-over')).toBe('');
      fireEvent.pointerUp(window, { clientX: 60, clientY: 25 });
      expect(zoneB.hasAttribute('data-dnd-touch-over')).toBe(false);
    } finally {
      restore();
    }
  });

  it('pointerup trên zone → onDrop nhận payload (event undefined như keyboard path)', () => {
    const onDrop = vi.fn();
    const { getByText } = render(<TouchHarness onDrop={onDrop} />);
    const zoneB = getByText('target B').closest('[data-drop-zone]')!;
    const card = getByText('Card touch').parentElement!;
    const restore = mockHitTest(zoneB.querySelector('p'));
    try {
      fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 0, clientY: 0 });
      fireEvent.pointerUp(window, { clientX: 99, clientY: 99 });
      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop).toHaveBeenCalledWith({ id: 'card-1' });
      expect(onDrop.mock.calls[0]![1]).toBeUndefined();
    } finally {
      restore();
    }
  });

  it('pointerup ngoài zone (elementFromPoint null) → KHÔNG onDrop, onDragEnd vẫn bắn, ghost dọn sạch', () => {
    const onDrop = vi.fn();
    const onDragEnd = vi.fn();
    const { getByText } = render(<TouchHarness onDrop={onDrop} onDragEnd={onDragEnd} />);
    const card = getByText('Card touch').parentElement!;
    const restore = mockHitTest(null);
    try {
      fireEvent.pointerDown(card, { pointerType: 'touch', clientX: 0, clientY: 0 });
      fireEvent.pointerUp(window, { clientX: 500, clientY: 500 });
      expect(onDrop).not.toHaveBeenCalled();
      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(document.querySelector('[data-dnd-ghost]')).toBeNull();
    } finally {
      restore();
    }
  });

  it('touch path của Draggable CÓ handle: pointerdown ngoài handle không kéo', () => {
    const onDragStart = vi.fn();
    const { getByText } = render(
      <Draggable
        data={{ id: 1 }}
        dragId="h1"
        handle={<button type="button">grip</button>}
        onDragStart={onDragStart}
      >
        <p>body</p>
      </Draggable>,
    );
    fireEvent.pointerDown(getByText('body'), { pointerType: 'touch', clientX: 1, clientY: 1 });
    expect(document.querySelector('[data-dnd-ghost]')).toBeNull();
    expect(onDragStart).not.toHaveBeenCalled();
  });
});
