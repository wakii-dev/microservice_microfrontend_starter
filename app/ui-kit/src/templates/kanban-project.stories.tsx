// Template Kanban Project Board — JIRA SOFTWARE style: card anatomy issue-type
// (icon + KEY mono + priority icon phải) + summary + epic chip + Avatar assignee;
// toolbar Input.Search + quick-filter pills (Tag.Checkable — filter state thật)
// + AvatarGroup + Button Backlog toggle cột đầu; quick-create '+ Create issue'
// mỗi cột mở Popover mini-form (Input + Select priority + Enter thêm card).
// Board dùng KanbanBoard renderCard — KHÔNG sửa core. ⚠️ KanbanBoard không có
// footer slot → nút '+ Create issue' nằm ở meta slot HEADER cột (deviation có
// chú thích trong report). Controlled state demo — consumer giữ store, board
// chỉ nhận columns + bắn onCardMove; WIP limit cột In Progress = 3 (full → chip
// đỏ 'Full' ở meta + core tự chặn transfer giữa cột).
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  Flex,
  Icon,
  Input,
  Popover,
  Select,
  Statistic,
  Tag,
  Timesheet,
  type IconName,
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

type IssueType = 'task' | 'bug' | 'story';
type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
type EpicTone = 'accent' | 'doing' | 'fail';

const ME = 'A'; // quick-filter "Chỉ việc của tôi" lọc theo assignee này

interface IssueMeta {
  type: IssueType;
  priority: Priority;
  epic: EpicTone;
  epicLabel: string;
  assignee: string;
  /** Số ngày desde lần cập nhật — quick-filter "Vừa cập nhật" lấy <= 2. */
  updated: number;
}

// Loại issue — icon bộ kit gần ngữ nghĩa Jira nhất (không tự vẽ SVG — rule 9)
const TYPE_META: Record<IssueType, { icon: IconName; cls: string }> = {
  task: { icon: 'check-circle', cls: 'text-accent' },
  bug: { icon: 'exclamation-triangle', cls: 'text-st-fail' },
  story: { icon: 'star', cls: 'text-st-done' },
};

const PRIORITY_META: Record<Priority, { icon: IconName; cls: string; label: string }> = {
  highest: { icon: 'chevron-up', cls: 'text-st-fail', label: 'Highest' },
  high: { icon: 'caret-up', cls: 'text-st-fail', label: 'High' },
  medium: { icon: 'minus', cls: 'text-st-doing', label: 'Medium' },
  low: { icon: 'caret-down', cls: 'text-ink3', label: 'Low' },
  lowest: { icon: 'chevron-down', cls: 'text-ink3', label: 'Lowest' },
};

const EPIC_CLS: Record<EpicTone, string> = {
  accent: 'bg-accent/10 text-accent',
  doing: 'bg-st-doing/10 text-st-doing',
  fail: 'bg-st-fail/10 text-st-fail',
};

// Meta tách khỏi card data — renderCard nhận KanbanCardData, tra meta theo key
const SEED_META: Record<string, IssueMeta> = {
  'ORCA-101': { type: 'task', priority: 'medium', epic: 'accent', epicLabel: 'Design System', assignee: 'A', updated: 1 },
  'ORCA-102': { type: 'bug', priority: 'highest', epic: 'fail', epicLabel: 'Gateway', assignee: 'B', updated: 0 },
  'ORCA-103': { type: 'story', priority: 'high', epic: 'accent', epicLabel: 'Design System', assignee: 'A', updated: 3 },
  'ORCA-104': { type: 'task', priority: 'low', epic: 'doing', epicLabel: 'Infra', assignee: 'C', updated: 5 },
  'ORCA-105': { type: 'bug', priority: 'high', epic: 'fail', epicLabel: 'Saga', assignee: 'A', updated: 2 },
  'ORCA-106': { type: 'story', priority: 'medium', epic: 'accent', epicLabel: 'Design System', assignee: 'B', updated: 1 },
  'ORCA-107': { type: 'task', priority: 'lowest', epic: 'doing', epicLabel: 'Infra', assignee: 'D', updated: 9 },
};

const SEED_COLUMNS: KanbanColumnData[] = [
  {
    key: 'backlog',
    title: 'Backlog',
    cards: [
      { key: 'ORCA-104', title: 'Scrollbar token-driven', description: 'Scrollbar-color theo --line' },
      { key: 'ORCA-107', title: 'Migrate admin remote sang Rspack 2' },
    ],
  },
  {
    key: 'doing',
    title: 'In Progress',
    wipLimit: 3,
    cards: [
      { key: 'ORCA-101', title: 'Dark tokens audit', description: 'Contrast sweep cả 2 theme' },
      { key: 'ORCA-102', title: 'Saga assign fail treo DLQ' },
      { key: 'ORCA-103', title: 'VirtualScroll dynamic height' },
    ],
  },
  {
    key: 'review',
    title: 'Review',
    cards: [{ key: 'ORCA-105', title: 'Popover labelledby wiring' }],
  },
  {
    key: 'done',
    title: 'Done',
    cards: [{ key: 'ORCA-106', title: 'Watermark SVG tile' }],
  },
];

const MEMBERS = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }, { name: 'Dave' }];

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_META) as Priority[]).map((p) => ({
  value: p,
  label: PRIORITY_META[p].label,
}));

const SHEET_ROWS = [
  { key: 'ORCA-101', label: 'ORCA-101 Dark tokens', meta: 'VU-53', values: [3, 5, 2, 6, 4, 0, 0] },
  { key: 'ORCA-106', label: 'ORCA-106 Watermark', meta: 'VU-53', values: [4, 4, 3, 5, 2, 1, 0] },
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
  const [columns, setColumns] = useState<KanbanColumnData[]>(SEED_COLUMNS);
  const [meta, setMeta] = useState<Record<string, IssueMeta>>(SEED_META);
  const [query, setQuery] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [showBacklog, setShowBacklog] = useState(true);
  // Quick-create: cột đang mở Popover + draft của form
  const [createFor, setCreateFor] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftPriority, setDraftPriority] = useState<Priority>('medium');
  const [seq, setSeq] = useState(108);

  // Filter + Full chip + create button — state thật, store gốc giữ nguyên
  const board = useMemo(() => {
    const submitIssue = (colKey: string) => {
      const summary = draft.trim();
      if (!summary) return;
      const key = `ORCA-${seq}`;
      setSeq((n) => n + 1);
      setColumns((prev) =>
        prev.map((col) => (col.key === colKey ? { ...col, cards: [...col.cards, { key, title: summary }] } : col)),
      );
      setMeta((prev) => ({
        ...prev,
        [key]: { type: 'task', priority: draftPriority, epic: 'accent', epicLabel: 'New feature', assignee: ME, updated: 0 },
      }));
      setDraft('');
      setCreateFor(null);
      message.success(`Đã tạo ${key} trong "${columns.find((c) => c.key === colKey)?.title}"`);
    };
    return columns
        .filter((col) => showBacklog || col.key !== 'backlog')
        .map((col) => {
          const full = col.wipLimit !== undefined && col.cards.length >= col.wipLimit;
          return {
            ...col,
            meta: (
              <span className="flex items-center gap-1">
                {full && <Badge variant="failed">Full</Badge>}
                <Popover
                  trigger="click"
                  placement="bottom"
                  open={createFor === col.key}
                  onOpenChange={(open) => {
                    setCreateFor(open ? col.key : null);
                    if (!open) setDraft('');
                  }}
                  title={`Tạo issue trong ${col.title}`}
                  className="w-64"
                  content={
                    <div className="flex flex-col gap-2">
                      <Input
                        aria-label="Tóm tắt issue"
                        placeholder="Tóm tắt ngắn…"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitIssue(col.key);
                        }}
                      />
                      <Select
                        className="w-full"
                        ariaLabel="Ưu tiên"
                        value={draftPriority}
                        onChange={(v) => setDraftPriority(v as Priority)}
                        options={PRIORITY_OPTIONS}
                      />
                      <Button size="small" type="primary" disabled={!draft.trim()} onClick={() => submitIssue(col.key)}>
                        Thêm ({PRIORITY_META[draftPriority].label})
                      </Button>
                    </div>
                  }
                >
                  <button
                    type="button"
                    aria-label={`Tạo issue trong ${col.title}`}
                    className="flex size-5 cursor-pointer items-center justify-center rounded-1 border-none bg-transparent text-ink3 transition-colors hover:bg-s3 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                  >
                    <Icon name="plus" size={12} />
                  </button>
                </Popover>
              </span>
            ),
            cards: col.cards.filter((card) => {
              const m = meta[card.key];
              const byMine = !onlyMine || m.assignee === ME;
              const byRecent = !recentOnly || m.updated <= 2;
              const q = query.trim().toLowerCase();
              const byQuery = !q || card.title.toLowerCase().includes(q) || card.key.toLowerCase().includes(q);
              return byMine && byRecent && byQuery;
            }),
          };
        });
  }, [columns, meta, query, onlyMine, recentOnly, showBacklog, createFor, draft, draftPriority, seq]);

  const visibleCount = board.flatMap((c) => c.cards).length;
  const totalCount = columns.flatMap((c) => c.cards).length;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Flex vertical gap={12}>
        {/* Toolbar Jira — search + quick-filter pills + members + Backlog toggle */}
        <Card>
          <Flex gap="middle" wrap className="items-center">
            <Input.Search
              className="w-56"
              size="small"
              placeholder="Tìm key hoặc tóm tắt…"
              onSearch={setQuery}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
            <Tag.Checkable checked={onlyMine} onChange={setOnlyMine}>
              Chỉ việc của tôi
            </Tag.Checkable>
            <Tag.Checkable checked={recentOnly} onChange={setRecentOnly}>
              Vừa cập nhật
            </Tag.Checkable>
            <Button size="small" type={showBacklog ? 'default' : 'text'} onClick={() => setShowBacklog((s) => !s)}>
              Backlog
            </Button>
            <span className="ml-auto flex items-center gap-3">
              <span className="text-meta text-ink3">
                {visibleCount}/{totalCount} issue
              </span>
              <AvatarGroup items={MEMBERS} size={24} max={3} />
            </span>
          </Flex>
        </Card>

        {/* Board + side panel */}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <KanbanBoard
            ariaLabel="Project board"
            columns={board}
            onCardMove={(cardKey, from, to, toIndex) => {
              setColumns((prev) => moveCard(prev, cardKey, from, to, toIndex));
              message.success(`Đã chuyển ${cardKey}: ${from} → ${to}`);
            }}
            renderCard={(card) => {
              const m = meta[card.key];
              const t = TYPE_META[m.type];
              const p = PRIORITY_META[m.priority];
              return (
                <div className="flex w-full flex-col gap-1.5">
                  {/* Dòng 1: loại issue + KEY mono + priority icon phải */}
                  <div className="flex items-center gap-1.5">
                    <Icon name={t.icon} size={13} className={t.cls} />
                    <span className="font-mono text-meta font-semibold text-ink2">{card.key}</span>
                    <span title={`Ưu tiên: ${p.label}`}>
                      <Icon name={p.icon} size={13} className={`ml-auto ${p.cls}`} />
                    </span>
                  </div>
                  {/* Dòng 2: summary */}
                  <div className="text-body font-medium text-ink">{card.title}</div>
                  {card.description && <div className="text-meta text-ink3">{card.description}</div>}
                  {/* Dòng 3: epic chip + Avatar assignee góc phải */}
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex rounded-pill px-2 py-0.5 text-[10px] font-medium ${EPIC_CLS[m.epic]}`}>
                      {m.epicLabel}
                    </span>
                    <Avatar size={20} className="ml-auto">
                      {m.assignee}
                    </Avatar>
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
                onCellChange={(rowKey, day, value) => message.info(`Log ${rowKey} ngày T${day + 1}: ${value ?? 'xoá'}h`)}
              />
            </Card>
          </Flex>
        </div>
      </Flex>
    </div>
  );
}

/** Project Board — Jira-style: card anatomy + quick-filter + WIP Full + quick-create Popover. */
export const ProjectBoard: Story = {
  name: 'Project Board — Jira-style card anatomy + quick filters (live state)',
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
