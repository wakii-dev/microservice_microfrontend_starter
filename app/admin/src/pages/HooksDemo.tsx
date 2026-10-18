// HooksDemo — showcase 6 hooks UI: useDebounce (input live), useCountdown
// (start/stop/reset), useCopyToClipboard, useWindowSize, useHover, useKeyPress
// (batch ⑦). Import thẳng từ barrel '@wakii/ui-kit'.
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Icon,
  Input,
  useCopyToClipboard,
  useCountdown,
  useDebounce,
  useHover,
  useKeyPress,
  useWindowSize,
} from '@wakii/ui-kit';

function DebounceCard() {
  const [text, setText] = useState('');
  const debounced = useDebounce(text, 300);
  return (
    <Card title="useDebounce — input live (300ms)">
      <div className="flex flex-col gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Gõ gì đó…" aria-label="Debounce input" />
        <p className="m-0 text-body text-ink3">
          Trực tiếp: <span className="text-ink">{text || '—'}</span>
        </p>
        <p className="m-0 text-body text-ink3">
          Debounced: <span className="font-medium text-accent">{debounced || '—'}</span>
        </p>
      </div>
    </Card>
  );
}

function CountdownCard() {
  const { seconds, isRunning, start, stop, reset } = useCountdown(10);
  return (
    <Card title="useCountdown — start/stop/reset">
      <div className="flex flex-col items-start gap-3">
        <span className="text-2xl font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {seconds}s
        </span>
        <div className="flex gap-2">
          <Button type="primary" size="small" disabled={isRunning} onClick={start}>
            Start
          </Button>
          <Button size="small" disabled={!isRunning} onClick={stop}>
            Stop
          </Button>
          <Button size="small" onClick={reset}>
            Reset
          </Button>
        </div>
        <Badge variant={isRunning ? 'doing' : 'done'}>{isRunning ? 'Đang chạy' : 'Đang dừng'}</Badge>
      </div>
    </Card>
  );
}

function ClipboardCard() {
  const [copiedText, copy] = useCopyToClipboard();
  return (
    <Card title="useCopyToClipboard">
      <div className="flex flex-col items-start gap-2">
        <Button icon={<Icon name="copy" size={12} />} onClick={() => void copy('Xin chào từ Wakii Admin 🎉')}>
          Copy text mẫu
        </Button>
        <p className="m-0 text-body text-ink3">
          {copiedText ? (
            <>
              Đã copy: <span className="text-st-done">{copiedText}</span>
            </>
          ) : (
            'Chưa copy gì'
          )}
        </p>
      </div>
    </Card>
  );
}

function WindowSizeCard() {
  const { width, height } = useWindowSize();
  return (
    <Card title="useWindowSize — resize cửa sổ">
      <Badge variant="created">
        {width} × {height}px
      </Badge>
    </Card>
  );
}

function HoverCard() {
  const [ref, hovered] = useHover<HTMLDivElement>();
  return (
    <Card title="useHover">
      <div
        ref={ref}
        className="grid h-24 cursor-pointer place-items-center rounded-lg border border-dashed border-line transition-colors"
        style={{ background: hovered ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : undefined }}
      >
        <span className="text-body text-ink2">{hovered ? 'Đang hover! 🎯' : 'Hover vào đây'}</span>
      </div>
    </Card>
  );
}

function KeyPressCard() {
  const enter = useKeyPress('Enter');
  const escape = useKeyPress('Escape');
  const a = useKeyPress('a');
  const KEYS = [
    { label: 'Enter', pressed: enter },
    { label: 'Esc', pressed: escape },
    { label: 'A', pressed: a },
  ];
  return (
    <Card title="useKeyPress — giữ phím để thấy">
      <div className="flex gap-2">
        {KEYS.map((k) => (
          <kbd
            key={k.label}
            className="rounded-lg border border-line px-3 py-1.5 text-label transition-colors"
            style={k.pressed ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : undefined}
          >
            {k.label}
          </kbd>
        ))}
      </div>
    </Card>
  );
}

export function HooksDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="m-0 text-h1 font-semibold text-ink">Hooks demo</h1>
        <p className="mt-1 mb-0 text-body text-ink3">6/16 hooks native — bản đầy đủ xem Storybook section “Hooks”.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DebounceCard />
        <CountdownCard />
        <ClipboardCard />
        <WindowSizeCard />
        <HoverCard />
        <KeyPressCard />
      </div>
    </div>
  );
}
