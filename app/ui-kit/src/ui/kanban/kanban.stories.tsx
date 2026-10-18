// Kanban stories — controlled board (consumer owns state via onCardMove).
// Native HTML5 DnD: mouse drag works in the browser; keyboard is fully wired
// (Tab → Space grab → arrows → Enter drop / Esc cancel) with aria-live output.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../avatar/index.js';
import { Badge } from '../badge/index.js';
import { Tag } from '../tag/index.js';
import { KanbanBoard, type KanbanColumnData } from './index';

// CSF render-only: meta KHÔNG gắn `component` — component có required props +
// story chỉ render() ⇒ StoryObj suy args BẮT BUỘC → TS2322 (pattern image.stories).
const meta = { title: 'Data Display/Kanban', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

const INITIAL: KanbanColumnData[] = [
  {
    key: 'todo',
    title: 'Todo',
    cards: [
      { key: 't1', title: 'Design tokens audit', description: 'Contrast pass on both themes', tag: 'design' },
      { key: 't2', title: 'Outbox relay retry', left: <Avatar size={24}>B</Avatar> },
    ],
  },
  {
    key: 'doing',
    title: 'Doing',
    cards: [{ key: 't3', title: 'Gateway rate-limit', tag: 'infra', left: <Avatar size={24}>A</Avatar> }],
  },
  {
    key: 'done',
    title: 'Done',
    cards: [{ key: 't4', title: 'MF spike pins', tag: 'spike' }],
  },
];

/** Basic — three columns; drag cards between columns or press Tab + Space for keyboard. */
export const Basic: Story = {
  render: () => <KanbanBoard columns={INITIAL} />,
};

/** InteractiveMove — a real useState store: onCardMove removes then splices the card. */
export const InteractiveMove: Story = {
  render: () => <InteractiveDemo />,
};

/** WipLimit — Doing is capped at 2 and already full: drops from other columns are
 * refused (fail border + live-region notice), but reordering inside the column still works. */
export const WipLimit: Story = {
  render: () => <WipDemo />,
};

/** CustomRender — renderCard keeps the drag/drop wiring and replaces the card body
 * (here: assignee avatar, id + priority tag). */
export const CustomRender: Story = {
  render: () => (
    <KanbanBoard
      columns={INITIAL}
      renderCard={(card, columnKey) => (
        <div className="flex items-start gap-2">
          <Avatar size={28}>{card.title.charAt(0)}</Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-body font-medium text-ink">{card.title}</div>
            <div className="mt-1 flex items-center gap-1">
              <Tag>{columnKey}</Tag>
              {card.tag && <Tag.Checkable checked={false}>{card.tag}</Tag.Checkable>}
            </div>
          </div>
        </div>
      )}
    />
  ),
};

/** KeyboardWalkthrough — grab with Space, move with arrows (↑↓ position, ←→ column),
 * drop with Enter, cancel with Esc. The live-region output is shown visibly below. */
export const KeyboardWalkthrough: Story = {
  render: () => <KeyboardDemo />,
};

function InteractiveDemo() {
  const [columns, setColumns] = useState(INITIAL);
  const [last, setLast] = useState<string>('—');
  return (
    <div className="flex flex-col gap-3">
      <KanbanBoard
        columns={columns}
        onCardMove={(cardKey, from, to, toIndex) => {
          setColumns((prev) => {
            const card = prev.flatMap((c) => c.cards).find((c) => c.key === cardKey);
            if (!card) return prev;
            return prev.map((col) => {
              const cards = col.cards.filter((c) => c.key !== cardKey);
              if (col.key === from) return { ...col, cards };
              if (col.key === to) {
                const next = [...cards];
                next.splice(toIndex, 0, card);
                return { ...col, cards: next };
              }
              return col;
            });
          });
          setLast(`${cardKey}: ${from} → ${to} @${toIndex}`);
        }}
      />
      <p className="m-0 text-meta text-ink3">
        Last onCardMove: <strong className="text-ink">{last}</strong>
      </p>
    </div>
  );
}

function WipDemo() {
  const [columns, setColumns] = useState<KanbanColumnData[]>([
    {
      key: 'todo',
      title: 'Todo',
      cards: [
        { key: 't1', title: 'Refill queue' },
        { key: 't2', title: 'One more idea' },
      ],
    },
    {
      key: 'doing',
      title: 'Doing',
      wipLimit: 2,
      meta: <Badge variant="failed">WIP</Badge>,
      cards: [
        { key: 't3', title: 'Gateway rate-limit' },
        { key: 't4', title: 'Saga compensation' },
      ],
    },
  ]);
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-meta text-ink3">
        Doing is at its WIP limit — dragging Todo cards in is refused (watch the border + your
        screen-reader live region); moving cards inside Doing still works.
      </p>
      <KanbanBoard
        columns={columns}
        onCardMove={(cardKey, from, to, toIndex) => {
          setColumns((prev) => {
            const card = prev.flatMap((c) => c.cards).find((c) => c.key === cardKey);
            if (!card) return prev;
            return prev.map((col) => {
              const cards = col.cards.filter((c) => c.key !== cardKey);
              if (col.key === from) return { ...col, cards };
              if (col.key === to) {
                const next = [...cards];
                next.splice(toIndex, 0, card);
                return { ...col, cards: next };
              }
              return col;
            });
          });
        }}
      />
    </div>
  );
}

function KeyboardDemo() {
  const [columns, setColumns] = useState(INITIAL);
  const [live, setLive] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-line bg-s3 p-3 text-body text-ink2">
        <strong className="text-ink">Walkthrough:</strong> <kbd className="text-accent">Tab</kbd> to a card →{' '}
        <kbd className="text-accent">Space</kbd> grab → <kbd className="text-accent">↑↓</kbd> position ·{' '}
        <kbd className="text-accent">←→</kbd> column → <kbd className="text-accent">Enter</kbd> drop →{' '}
        <kbd className="text-accent">Esc</kbd> cancel. Announced via aria-live.
      </div>
      <KanbanBoard
        columns={columns}
        ariaLabel="Keyboard walkthrough board"
        onCardMove={(cardKey, from, to, toIndex) => {
          setLive(`onCardMove(${cardKey}, ${from}, ${to}, ${toIndex})`);
          setColumns((prev) => {
            const card = prev.flatMap((c) => c.cards).find((c) => c.key === cardKey);
            if (!card) return prev;
            return prev.map((col) => {
              const cards = col.cards.filter((c) => c.key !== cardKey);
              if (col.key === from) return { ...col, cards };
              if (col.key === to) {
                const next = [...cards];
                next.splice(toIndex, 0, card);
                return { ...col, cards: next };
              }
              return col;
            });
          });
        }}
      />
      <p role="log" className="m-0 text-meta text-ink3">
        {live || 'No move yet — the board announces each move politely.'}
      </p>
    </div>
  );
}
