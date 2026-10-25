// hooks-new.stories.tsx — demo tương tác cho 12 hooks wave mới (PR #65), bỗ
// tríết lý "docs sống" của kit (khác hooks.stories.tsx: 16 hooks native đầu).
// MỖI demo là 1 export const story; import trực tiếp từng file (barrel do
// coordinator thêm lúc commit). Title LỒNG 'Hooks/New Wave' — KHÔNG đè story
// của hooks.stories.tsx (title 'Theming & Motion/Hooks'). Gom nhóm: lifecycle
// trio 1 story, fullscreen + title 1 story → 9 stories / 12 hooks.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { useControllableState } from './useControllableState.js';
import { useEventListener } from './useEventListener.js';
import { useFullscreen } from './useFullscreen.js';
import { useInfiniteScroll } from './useInfiniteScroll.js';
import { useInView } from './useInView.js';
import { useIsFirstRender } from './useIsFirstRender.js';
import { useMeasure } from './useMeasure.js';
import { useMountEffect } from './useMountEffect.js';
import { useOnlineStatus } from './useOnlineStatus.js';
import { useScrollProgress } from './useScrollProgress.js';
import { useTitle } from './useTitle.js';
import { useUpdateEffect } from './useUpdateEffect.js';

const meta = {
  title: 'Theming & Motion/Hooks/New Wave',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '12 hooks from the new wave (PR #65): useMountEffect · useUpdateEffect · useIsFirstRender · useControllableState · useEventListener · useScrollProgress · useInView · useInfiniteScroll · useMeasure · useOnlineStatus · useFullscreen · useTitle. 9 interactive demos below — lifecycle trio and the fullscreen/title pair share one story each.',
      },
    },
  },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

// Demo dùng Tailwind token classes (bg-s*/text-ink*/border-line) — cùng ngôn
// ngữ design system với component stories; mọi nút giữ chuẩn focus-visible ring.
const demoBox = 'flex flex-col gap-2 text-body text-ink';
const demoPanel = 'rounded-lg border border-line bg-s2 p-3';
const demoBtn =
  'cursor-pointer rounded-lg border border-line bg-s1 px-3 py-1.5 text-label text-ink2 transition-colors hover:border-accent-hi hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';
const demoMono = 'font-mono text-meta text-ink2';
const demoBadge = (on: boolean) =>
  `inline-flex w-fit items-center gap-1 rounded-pill border px-2.5 py-1 text-meta font-semibold ${
    on ? 'border-st-done text-st-done' : 'border-line text-ink3'
  }`;
const demoInput =
  'h-8 rounded-lg border border-line bg-s2 px-3 text-body text-ink placeholder:text-ink4 focus:border-accent-hi focus:outline-none';

/** Mount / update / first-render — bấm để xem hiệu chạy đúng mốc nào. */
function LifecycleTrioDemo() {
  const [renders, setRenders] = useState(1);
  const [dep, setDep] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const isFirst = useIsFirstRender();
  const push = (line: string) => setLog((l) => [...l.slice(-7), line]);

  useMountEffect(() => push('useMountEffect → ran once on mount'));
  useUpdateEffect(() => push(`useUpdateEffect → dep = ${dep} (mount was skipped)`), [dep]);

  return (
    <div className={demoBox}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={demoBadge(isFirst)}>first render: {String(isFirst)}</span>
        <span className={demoMono}>renders: {renders}</span>
        <button type="button" className={demoBtn} onClick={() => setRenders((r) => r + 1)}>
          Re-render
        </button>
        <button type="button" className={demoBtn} onClick={() => setDep((d) => d + 1)}>
          Bump update-effect dep
        </button>
      </div>
      <div className={demoPanel}>
        <ul className="m-0 flex max-h-32 list-none flex-col gap-1 overflow-y-auto p-0">
          {log.map((line, i) => (
            <li key={`${i}-${line}`} className={demoMono}>
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className={demoMono}>
        Tip: “Re-render” bumps the count but logs nothing — useUpdateEffect only reacts to its deps.
      </div>
    </div>
  );
}

export const LifecycleTrio: Story = {
  name: 'Lifecycle trio (useMountEffect · useUpdateEffect · useIsFirstRender)',
  render: () => <LifecycleTrioDemo />,
};

/** Controlled/uncontrolled — đổi chế độ sống để thấy quyền sở hữu state chuyển tay. */
function ControllableStateDemo() {
  const [mode, setMode] = useState<'uncontrolled' | 'controlled'>('uncontrolled');
  const [callerValue, setCallerValue] = useState(1);
  const [changes, setChanges] = useState<string[]>([]);
  const [value, set] = useControllableState<number>({
    value: mode === 'controlled' ? callerValue : undefined,
    defaultValue: 1,
    onChange: (v) => setChanges((c) => [...c.slice(-4), `onChange → ${v}`]),
  });

  return (
    <div className={demoBox}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={demoBadge(mode === 'controlled')}>mode: {mode}</span>
        <span className={demoMono}>value: {value}</span>
        <button type="button" className={demoBtn} onClick={() => setMode((m) => (m === 'controlled' ? 'uncontrolled' : 'controlled'))}>
          Switch mode
        </button>
        <button type="button" className={demoBtn} onClick={() => set((v) => v + 1)}>
          Component set +1
        </button>
        <button type="button" className={demoBtn} disabled={mode !== 'controlled'} onClick={() => setCallerValue((v) => v + 10)}>
          Caller set +10
        </button>
      </div>
      <div className={demoPanel}>
        {changes.length === 0 ? (
          <span className={demoMono}>onChange not fired yet</span>
        ) : (
          changes.map((line, i) => (
            <div key={`${i}-${line}`} className={demoMono}>
              {line}
            </div>
          ))
        )}
      </div>
      <div className={demoMono}>
        Controlled mode: “Component set +1” only fires onChange — the value moves when the caller moves it.
      </div>
    </div>
  );
}

export const ControllableState: Story = {
  name: 'useControllableState',
  render: () => <ControllableStateDemo />,
};

/** Event listener — listener trên window (keydown) + element ref (click). */
function EventListenerDemo() {
  const [keyCount, setKeyCount] = useState(0);
  const [lastKey, setLastKey] = useState('—');
  const [clickCount, setClickCount] = useState(0);
  const zoneRef = useRef<HTMLDivElement>(null);

  useEventListener('keydown', (e) => {
    setKeyCount((c) => c + 1);
    setLastKey((e as KeyboardEvent).key);
  });
  useEventListener('click', () => setClickCount((c) => c + 1), zoneRef);

  return (
    <div className={demoBox}>
      <div
        ref={zoneRef}
        className="grid h-20 cursor-pointer place-items-center rounded-lg border border-dashed border-line bg-s1 text-label text-ink2 select-none hover:border-accent-hi hover:text-accent"
      >
        Click me — this zone listens via an element ref ({clickCount} clicks)
      </div>
      <div className={demoMono}>
        Keydown anywhere in the canvas: {keyCount} keys pressed, last key “{lastKey}”
      </div>
    </div>
  );
}

export const EventListener: Story = {
  name: 'useEventListener',
  render: () => <EventListenerDemo />,
};

/** Scroll progress — cuộn canvas story, thanh % bám theo tiến độ trang. */
function ScrollProgressDemo() {
  const progress = useScrollProgress();

  return (
    <div className={demoBox}>
      <div className={demoMono}>Page scroll progress: {Math.round(progress * 100)}%</div>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-s3">
        <div className="h-full rounded-pill bg-accent transition-[width] duration-150 ease-out" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="grid h-48 place-items-center rounded-lg border border-dashed border-line text-meta text-ink4">
        Scroll the story canvas up and down ↑↓
      </div>
    </div>
  );
}

export const ScrollProgress: Story = {
  name: 'useScrollProgress',
  render: () => <ScrollProgressDemo />,
};

/** In view — hộp đổi màu theo viewport; bật/tắt `once` để xem đảo 2 chiều. */
function InViewDemo() {
  const [once, setOnce] = useState(false);
  const { ref, inView } = useInView<HTMLDivElement>({ once });

  return (
    <div className={demoBox}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={demoBadge(inView)}>inView: {String(inView)}</span>
        <button type="button" className={demoBtn} onClick={() => setOnce((o) => !o)}>
          once: {String(once)}
        </button>
      </div>
      <div className="h-40 overflow-y-auto rounded-lg border border-line bg-s1 p-2">
        <div className="h-32" />
        <div
          ref={ref}
          className={`grid h-16 place-items-center rounded-lg border text-meta transition-colors duration-200 ${
            inView ? 'border-st-done bg-st-done/10 text-st-done' : 'border-line bg-s3 text-ink3'
          }`}
        >
          {inView ? 'In view' : 'Scroll me into view ↓'}
        </div>
      </div>
    </div>
  );
}

export const InView: Story = {
  name: 'useInView',
  render: () => <InViewDemo />,
};

/** Infinite scroll — cuộn tới sentinel là list tự dài (loading guard + hasMore). */
function InfiniteScrollDemo() {
  const [items, setItems] = useState<number[]>(() => Array.from({ length: 8 }, (_, i) => i + 1));
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    disabled: !hasMore,
    onLoadMore: async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      setItems((prev) => [...prev, ...Array.from({ length: 4 }, (_, i) => prev.length + i + 1)]);
      setLoading(false);
    },
  });

  return (
    <div className={demoBox}>
      <div className="flex items-center gap-2">
        <span className={demoBadge(hasMore)}>{items.length} items</span>
        <button type="button" className={demoBtn} onClick={() => setHasMore((h) => !h)}>
          {hasMore ? 'Simulate end of data' : 'Re-enable loading'}
        </button>
      </div>
      <div className="flex h-40 list-none flex-col gap-1 overflow-y-auto rounded-lg border border-line bg-s1 p-2">
        {items.map((n) => (
          <div key={n} className={`${demoPanel} !py-1.5`}>
            Item #{n}
          </div>
        ))}
        {loading && <div className={`${demoMono} px-1`}>Loading…</div>}
        <div ref={sentinelRef} className="h-1" />
      </div>
      <div className={demoMono}>Scroll the list to the bottom — the sentinel triggers onLoadMore.</div>
    </div>
  );
}

export const InfiniteScroll: Story = {
  name: 'useInfiniteScroll',
  render: () => <InfiniteScrollDemo />,
};

/** Measure — kéo góc phải-dưới box, kích thước cập nhật realtime qua ResizeObserver. */
function MeasureDemo() {
  const [ref, size] = useMeasure<HTMLDivElement>();

  return (
    <div className={demoBox}>
      <div
        ref={ref}
        className="grid min-h-14 min-w-32 max-w-full resize place-items-center overflow-auto rounded-lg border border-dashed border-line bg-s1 p-3 text-label text-ink2"
        style={{ height: 72, width: 260 }}
      >
        Drag my bottom-right corner ↘
      </div>
      <div className={demoMono}>
        Measured: {Math.round(size.width)} × {Math.round(size.height)}px
      </div>
    </div>
  );
}

export const Measure: Story = {
  name: 'useMeasure',
  render: () => <MeasureDemo />,
};

/** Online status — badge trạng thái mạng + nút giả lập (stub navigator.onLine, tự khôi phục). */
function OnlineStatusDemo() {
  const online = useOnlineStatus();
  const [stubbed, setStubbed] = useState(false);
  const originalRef = useRef<boolean | null>(null);

  const simulate = (next: boolean) => {
    if (originalRef.current === null) originalRef.current = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: next, configurable: true });
    setStubbed(true);
    window.dispatchEvent(new Event(next ? 'online' : 'offline'));
  };
  const restore = () => {
    const orig = originalRef.current;
    if (orig === null) return;
    Object.defineProperty(navigator, 'onLine', { value: orig, configurable: true });
    originalRef.current = null;
    setStubbed(false);
    window.dispatchEvent(new Event(orig ? 'online' : 'offline'));
  };
  // Rời story → trả navigator.onLine về giá trị thật (đừng để stub dính lại canvas khác)
  useEffect(() => () => restore(), []);

  return (
    <div className={demoBox}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={demoBadge(online)}>{online ? '● Online' : '○ Offline'}</span>
        {stubbed && <span className={demoMono}>(simulated)</span>}
        <button type="button" className={demoBtn} disabled={!online} onClick={() => simulate(false)}>
          Simulate offline
        </button>
        <button type="button" className={demoBtn} disabled={online} onClick={() => simulate(true)}>
          Simulate online
        </button>
        <button type="button" className={demoBtn} disabled={!stubbed} onClick={restore}>
          Restore real value
        </button>
      </div>
      <div className={demoMono}>Real use case: banner “mất kết nối” — the hook mirrors navigator.onLine via window online/offline events.</div>
    </div>
  );
}

export const OnlineStatus: Story = {
  name: 'useOnlineStatus',
  render: () => <OnlineStatusDemo />,
};

/** Fullscreen + title — 2 hook "document chrome": fullscreen 1 khung & đổi tiêu đề tab. */
function FullscreenTitleDemo() {
  const { ref, isFullscreen, toggle } = useFullscreen();
  const [title, setTitle] = useState('New wave hooks demo');
  useTitle(title);

  return (
    <div className={demoBox}>
      <div
        ref={ref}
        className={`grid h-24 place-items-center rounded-lg border text-label transition-colors duration-200 ${
          isFullscreen ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-s1 text-ink2'
        }`}
      >
        {isFullscreen ? 'Fullscreen — press ESC to exit' : 'Regular frame'}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={demoBtn} onClick={toggle}>
          {isFullscreen ? 'Exit fullscreen' : 'Go fullscreen'}
        </button>
        <span className={demoBadge(isFullscreen)}>isFullscreen: {String(isFullscreen)}</span>
      </div>
      <div className="h-px bg-line" role="presentation" />
      <div className="flex flex-wrap items-center gap-2">
        <label className={demoMono} htmlFor="hooks-new-title-input">
          document.title
        </label>
        <input
          id="hooks-new-title-input"
          className={`${demoInput} w-64`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className={demoMono}>
        Watch the browser tab while typing — leaving this story restores the previous title (restoreOnUnmount default).
      </div>
    </div>
  );
}

export const FullscreenTitle: Story = {
  name: 'useFullscreen + useTitle',
  render: () => <FullscreenTitleDemo />,
};
