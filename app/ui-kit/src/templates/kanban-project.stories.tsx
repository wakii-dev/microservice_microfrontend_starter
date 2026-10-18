// Template Kanban Project Board — ghép thành 1 màn hình "sản phẩm": board 4 cột
// (WIP limit Doing) + toolbar filter sống (Segmented/Input.Search/Select) + panel
// Timesheet log giờ tuần + toast message khi move card. Controlled state demo —
// consumer (app) giữ store, ui-kit chỉ nhận columns + bắn onCardMove.
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Avatar,
  Badge,
  Card,
  Flex,
  Input,
  Segmented,
  Select,
  Statistic,
  Tag,
  Timesheet,
  type KanbanCardData,
  type KanbanColumnData,
  KanbanBoard,
  message,
} from '../index';

const meta = {
  title: 'Templates/Kanban Project',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

type Priority = 'high' | 'medium' | 'low';

interface ProjectCard extends KanbanCardData {
  priority: Priority;
  assignee: string;
}

const PRIORITY_BADGE: Record<Priority, { variant: 'failed' | 'doing' | 'todo'; label: string }> = {
  high: { variant: 'failed', label: 'High' },
  medium: { variant: 'doing', label: 'Med' },
  low: { variant: 'todo', label: 'Low' },
};

const SEED: KanbanColumnData[] = [
  {
    key: 'backlog',
    title: 'Backlog',
    cards: [
      { key: 'p1', title: 'Dark tokens audit', description: 'Contrast sweep cả 2 theme', priority: 'medium', assignee: 'A' },
      { key: 'p2', title: 'VirtualScroll dynamic height', priority: 'low', assignee: 'B' },
    ] as ProjectCard[],
  },
  {
    key: 'doing',
    title: 'Doing',
    wipLimit: 3,
    meta: <Badge variant="doing">WIP 2/3</Badge>,
    cards: [
      { key: 'p3', title: 'TreeTable recursive rows', description: 'Expander + indent theo depth', priority: 'high', assignee: 'A' },
      { key: 'p4', title: 'Scrollbar token-driven', priority: 'low', assignee: 'C' },
    ] as ProjectCard[],
  },
  {
    key: 'review',
    title: 'Review',
    cards: [
      { key: 'p5', title: 'Popover labelledby wiring', priority: 'medium', assignee: 'B' },
    ] as ProjectCard[],
  },
  {
    key: 'done',
    title: 'Done',
    cards: [
      { key: 'p6', title: 'Watermark SVG tile', priority: 'high', assignee: 'A' },
      { key: 'p7', title: 'QRCode vendored', priority: 'low', assignee: 'D' },
    ] as ProjectCard[],
  },
];

const ASSIGNEES = [
  { label: 'Tất cả assignee', value: 'all' },
  { label: 'Alice (A)', value: 'A' },
  { label: 'Bob (B)', value: 'B' },
  { label: 'Carol (C)', value: 'C' },
  { label: 'Dave (D)', value: 'D' },
];

const SHEET_ROWS = [
  { key: 'p3', label: 'TreeTable recursive', meta: 'VU-53', values: [3, 5, 2, 6, 4, 0, 0] },
  { key: 'p6', label: 'Watermark SVG tile', meta: 'VU-53', values: [4, 4, 3, 5, 2, 1, 0] },
];

function moveCard(columns: KanbanColumnData[], cardKey: string, from: string, to: string, toIndex: number): KanbanColumnData[] {
  const card = columns.flatMap((c) => c.cards).find((c) => c.key === cardKey);
  if (!card) return columns;
  return columns.map((col) => {
    const cards = col.cards.filter((c) => c.key !== cardKey);
    if (col.key === from) return { ...col, cards };
    if (col.key === to) {
      const next = [...cards];
      next.splice(toIndex, 0, card);
      return { ...col, cards: next };
    }
    return col;
  });
}

function ProjectBoardDemo() {
  const [columns, setColumns] = useState<KanbanColumnData[]>(SEED);
  const [view, setView] = useState('all');
  const [query, setQuery] = useState('');
  const [assignee, setAssignee] = useState('all');

  // Filter: chỉ ẩn card khỏi board — store gốc giữ nguyên, move vẫn theo cardKey.
  const filtered = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => {
          const pc = c as ProjectCard;
          const byView = view === 'all' || pc.priority === view;
          const byAssignee = assignee === 'all' || pc.assignee === assignee;
          const byQuery = !query.trim() || c.title.toLowerCase().includes(query.trim().toLowerCase());
          return byView && byAssignee && byQuery;
        }),
      })),
    [columns, view, assignee, query],
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Flex vertical gap={12}>
        {/* Toolbar — filter sống: Segmented priority + Search + Select assignee */}
        <Card>
          <Flex gap="middle" wrap className="items-center">
            <Segmented
              options={[
                { label: 'All', value: 'all' },
                { label: 'High', value: 'high' },
                { label: 'Med', value: 'medium' },
                { label: 'Low', value: 'low' },
              ]}
              value={view}
              onChange={setView}
            />
            <Input.Search
              className="w-64"
              placeholder="Tìm task…"
              enterButton
              onSearch={setQuery}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
            <Select
              className="w-48"
              ariaLabel="Lọc assignee"
              value={assignee}
              onChange={(v) => setAssignee(Array.isArray(v) ? v[0] : v)}
              options={ASSIGNEES}
            />
            <span className="ml-auto text-meta text-ink3">
              {filtered.flatMap((c) => c.cards).length} card hiển thị / {columns.flatMap((c) => c.cards).length}
            </span>
          </Flex>
        </Card>

        {/* Board + side panel */}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <KanbanBoard
            ariaLabel="Project board"
            columns={filtered}
            onCardMove={(cardKey, from, to, toIndex) => {
              setColumns((prev) => moveCard(prev, cardKey, from, to, toIndex));
              message.success(`Đã chuyển ${cardKey}: ${from} → ${to}`);
            }}
            renderCard={(card) => {
              const pc = card as ProjectCard;
              const p = PRIORITY_BADGE[pc.priority];
              return (
                <div className="flex w-full items-start gap-2">
                  <Avatar size={28}>{pc.assignee}</Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-body font-medium text-ink">{card.title}</div>
                    {card.description && <div className="mt-0.5 text-meta text-ink3">{card.description}</div>}
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant={p.variant}>{p.label}</Badge>
                      <Tag className="text-meta">@{pc.assignee}</Tag>
                    </div>
                  </div>
                </div>
              );
            }}
          />

          {/* Side panel — log giờ tuần (Timesheet mini) + tổng */}
          <Flex vertical gap={12}>
            <Card>
              <Flex gap="middle" className="items-center">
                <Statistic title="Log tuần này" value="39h" suffix="/ 40h" />
              </Flex>
            </Card>
            <Card title="Timesheet">
              <Timesheet
                rows={SHEET_ROWS}
                week={new Date()}
                editable
                onCellChange={(rowKey, day, value) =>
                  message.info(`Log ${rowKey} ngày T${day + 1}: ${value ?? 'xoá'}h`)
                }
              />
            </Card>
          </Flex>
        </div>
      </Flex>
    </div>
  );
}

/** Full demo — board sống + filter + WIP + timesheet; kéo card để thấy toast. */
export const ProjectBoard: Story = {
  name: 'Project Board — board + WIP + filter + timesheet (live state)',
  render: () => <ProjectBoardDemo />,
};

export const DarkTheme: Story = {
  name: 'DarkTheme — board + panel theo token',
  render: () => (
    <div data-bp-theme="dark" className="min-h-screen">
      <ProjectBoardDemo />
    </div>
  ),
};
