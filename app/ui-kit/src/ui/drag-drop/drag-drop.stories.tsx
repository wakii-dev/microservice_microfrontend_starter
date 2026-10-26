// DragDrop stories — native HTML5 DnD primitives. Payload flows through
// dataTransfer (DRAG_MIME JSON), so it works across any DOM boundary.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '../icons/index.js';
import { DragDropProvider, Draggable, DropZone } from './index';

// CSF render-only: meta KHÔNG gắn `component` — component có required props +
// story chỉ render() ⇒ StoryObj suy args BẮT BUỘC → TS2322 (pattern image.stories).
const meta = { title: 'Primitives/DragDrop', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

function DroppedLog() {
  const [dropped, setDropped] = useState<unknown>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-6">
        <Draggable data={{ id: 1, label: 'Design tokens' }} draggingClass="shadow-lift">
          <div className="w-48 rounded-xl border border-line bg-s2 p-3 text-body text-ink">Drag me — Design tokens</div>
        </Draggable>
        <DropZone ariaLabel="Drop here" onDrop={(d) => setDropped(String(d))} className="grid min-h-32 w-64 place-items-center rounded-xl border border-dashed border-line text-meta text-ink3">
          Drop here
        </DropZone>
      </div>
      <p className="m-0 text-meta text-ink3">
        Last dropped: <strong className="text-ink">{dropped ? JSON.stringify(dropped) : '—'}</strong>
      </p>
    </div>
  );
}

/** Basic — drag the card into the zone; the JSON payload shows below. */
export const Basic: Story = {
  render: () => <DroppedLog />,
};

/** HandleOnly — with the `handle` prop only the grip starts a drag; dragging the body is canceled. */
export const HandleOnly: Story = {
  render: () => (
    <HandleOnlyDemo />
  ),
};

function HandleOnlyDemo() {
  const [dropped, setDropped] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-6">
        <Draggable
          data="handle-only"
          handle={
            <div className="flex cursor-grab items-center gap-1 rounded-lg bg-s3 px-2 py-1 text-meta text-ink2">
              <Icon name="ellipsis-v" size={12} /> grip
            </div>
          }
        >
          <div className="w-56 rounded-xl border border-line bg-s2 p-3 text-body text-ink2">
            Body text does not start a drag — only the grip does.
          </div>
        </Draggable>
        <DropZone ariaLabel="Handle target" onDrop={(d) => setDropped(String(d))} className="grid min-h-32 w-56 place-items-center rounded-xl border border-dashed border-line text-meta text-ink3">
          Drop target
        </DropZone>
      </div>
      <p className="m-0 text-meta text-ink3">
        Last dropped: <strong className="text-ink">{dropped ?? '—'}</strong>
      </p>
    </div>
  );
}

/** Disabled — the locked card can't be dragged (no draggable attribute, not-allowed cursor). */
export const Disabled: Story = {
  render: () => (
    <div className="flex gap-4">
      <Draggable data="free">
        <div className="w-44 rounded-xl border border-line bg-s2 p-3 text-body text-ink">Draggable</div>
      </Draggable>
      <Draggable data="locked" disabled>
        <div className="w-44 rounded-xl border border-line bg-s2 p-3 text-body text-ink3">Disabled</div>
      </Draggable>
    </div>
  ),
};

/** AcceptFilter — the zone only accepts `application/other`, so kit payloads never highlight it. */
export const AcceptFilter: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-meta text-ink3">
        <code className="text-accent">accept</code> filters on <code className="text-accent">dataTransfer.types</code> —
        the only part of the payload browsers allow reading during dragover.
      </p>
      <div className="flex items-start gap-6">
        <Draggable data="kit-payload">
          <div className="w-44 rounded-xl border border-line bg-s2 p-3 text-body text-ink">Kit payload</div>
        </Draggable>
        <DropZone accept={['application/other']} className="grid min-h-28 w-56 place-items-center rounded-xl border border-dashed border-line text-meta text-ink3">
          Never highlights for the kit MIME
        </DropZone>
        <DropZone className="grid min-h-28 w-56 place-items-center rounded-xl border border-dashed border-line text-meta text-ink3">
          Default — accepts the kit MIME
        </DropZone>
      </div>
    </div>
  ),
};

/** KeyboardWorkflow — Space grabs, arrows move the active zone, Enter drops, Esc cancels. */
export const KeyboardWorkflow: Story = {
  render: () => <KeyboardWorkflowDemo />,
};

/** CustomStyled — slots-wave classNames + style: Draggable `root` lands on the
 * role=button wrapper and `handle` on the grip holder; DropZone `root` lands on
 * the drop target; `style` merges on the same elements. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div className="flex items-start gap-6">
      <Draggable
        data={{ id: 9, label: 'Slotted card' }}
        classNames={{ root: 'rounded-xl' }}
        style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
        className="w-48 border border-dashed border-accent bg-accent/5 p-3 text-body text-ink"
      >
        Slotted draggable card
      </Draggable>
      <DropZone
        ariaLabel="Slotted zone"
        classNames={{ root: 'rounded-xl border-dashed border-accent bg-accent/5' }}
        style={{ boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.08)' }}
        className="grid min-h-32 w-64 place-items-center border text-meta text-ink3"
      >
        Slotted drop zone
      </DropZone>
    </div>
  ),
};

function KeyboardWorkflowDemo() {
  const [log, setLog] = useState<string[]>([]);
  const push = (zone: string) => (data: unknown) => setLog((l) => [`dropped ${JSON.stringify(data)} → ${zone}`, ...l].slice(0, 4));
  return (
    <DragDropProvider>
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-line bg-s3 p-3 text-body text-ink2">
          <strong className="text-ink">Keyboard:</strong> Tab to the card → <kbd className="text-accent">Space</kbd> grab →{' '}
          <kbd className="text-accent">Arrows</kbd> pick a zone → <kbd className="text-accent">Enter</kbd> drop →{' '}
          <kbd className="text-accent">Esc</kbd> cancel.
        </div>
        <div className="flex items-start gap-6">
          <Draggable data={101} dragId="kb-card">
            <div className="w-44 rounded-xl border border-line bg-s2 p-3 text-body text-ink">Task #101</div>
          </Draggable>
          <DropZone ariaLabel="Backlog" onDrop={push('Backlog')} className="grid min-h-28 w-44 place-items-center rounded-xl border border-dashed border-line text-meta text-ink3">
            Backlog
          </DropZone>
          <DropZone ariaLabel="Doing" onDrop={push('Doing')} className="grid min-h-28 w-44 place-items-center rounded-xl border border-dashed border-line text-meta text-ink3">
            Doing
          </DropZone>
        </div>
        <ul className="m-0 list-none p-0 text-meta text-ink3">
          {log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </DragDropProvider>
  );
}
