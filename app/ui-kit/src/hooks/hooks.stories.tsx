// hooks.stories.tsx — section 'Hooks' demo tương tác cho bộ 16 hooks native (spec usehooks.com,
// tham chiếu MIT ui.dev). MỖI demo là 1 export const story; import trực tiếp từng file
// (barrel src/index.ts do coordinator thêm lúc commit — worker không sửa).
// Các hook không có demo ở đây (storage/toggle/previous/default/throttle/timeout/clickAway/
// hover/keyPress/lockBodyScroll) xem test behavior kèm từng file.
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useCopyToClipboard } from './useCopyToClipboard.js';
import { useCountdown } from './useCountdown.js';
import { useDebounce } from './useDebounce.js';
import { useMediaQuery } from './useMediaQuery.js';
import { useWindowSize } from './useWindowSize.js';

const meta = {
  title: 'Hooks',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '16 hooks native: useLocalStorage · useSessionStorage · useToggle · usePrevious · useDefault · useDebounce · useThrottle · useTimeout · useCountdown · useClickAway · useHover · useKeyPress · useMediaQuery · useLockBodyScroll · useWindowSize · useCopyToClipboard. 5 demo tương tác bên dưới — còn lại xem test behavior colocated.',
      },
    },
  },
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

// Demo dùng element thuần + inline style — không phụ thuộc theme/provider của Storybook
const demoBox: CSSProperties = { display: 'grid', gap: 10, maxWidth: 420, fontFamily: 'sans-serif' };
const demoInput: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  fontSize: 14,
};
const demoButton: CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#344054',
  cursor: 'pointer',
  fontSize: 14,
};
const demoButtonActive: CSSProperties = { ...demoButton, background: '#eef4ff', borderColor: '#84adff' };
const demoMono: CSSProperties = { fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#475467' };
const demoBadge = (on: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  borderRadius: 999,
  border: `1px solid ${on ? '#12b76a' : '#d0d5dd'}`,
  color: on ? '#067647' : '#667085',
  fontSize: 13,
  fontWeight: 600,
});

/** Debounce input live — gõ liên tục, giá trị "Debounced" chỉ nhảy sau 300ms ngừng gõ. */
function DebounceDemo() {
  const [text, setText] = useState('');
  const debounced = useDebounce(text, 300);

  return (
    <div style={demoBox}>
      <input
        style={demoInput}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Gõ thử… (debounce 300ms)"
      />
      <div style={demoMono}>Trực tiếp: {text || '—'}</div>
      <div style={demoMono}>Debounced: {debounced || '—'}</div>
    </div>
  );
}

export const Debounce: Story = {
  name: 'useDebounce',
  render: () => <DebounceDemo />,
};

/** Countdown — bấm Start/Stop/Reset, đếm tới 0 tự dừng. */
function CountdownDemo() {
  const { seconds, isRunning, start, stop, reset } = useCountdown(10);

  return (
    <div style={demoBox}>
      <div style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{seconds}s</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={isRunning ? demoButtonActive : demoButton} onClick={start} disabled={isRunning}>
          Start
        </button>
        <button type="button" style={demoButton} onClick={stop} disabled={!isRunning}>
          Stop
        </button>
        <button type="button" style={demoButton} onClick={reset}>
          Reset
        </button>
      </div>
      <div style={demoMono}>isRunning: {String(isRunning)}</div>
    </div>
  );
}

export const Countdown: Story = {
  name: 'useCountdown',
  render: () => <CountdownDemo />,
};

/** Clipboard copy — bấm copy rồi dán ra đâu đó để kiểm tra. */
function ClipboardDemo() {
  const [copiedText, copy] = useCopyToClipboard();

  return (
    <div style={demoBox}>
      <button type="button" style={demoButton} onClick={() => void copy('Xin chào từ useCopyToClipboard! 🎉')}>
        Copy văn bản mẫu
      </button>
      <div style={demoMono}>{copiedText ? `Đã copy: ${copiedText}` : 'Chưa copy gì'}</div>
    </div>
  );
}

export const CopyToClipboard: Story = {
  name: 'useCopyToClipboard',
  render: () => <ClipboardDemo />,
};

/** Media query badge — badge sống theo viewport (resize canvas) + color scheme hệ thống. */
function MediaQueryDemo() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <div style={{ ...demoBox, gridAutoFlow: 'column', justifyContent: 'start' }}>
      <span style={demoBadge(isDesktop)}>viewport ≥ 768px: {isDesktop ? 'ĐÚNG' : 'SAI'}</span>
      <span style={demoBadge(prefersDark)}>prefers dark: {prefersDark ? 'ĐÚNG' : 'SAI'}</span>
    </div>
  );
}

export const MediaQuery: Story = {
  name: 'useMediaQuery',
  render: () => <MediaQueryDemo />,
};

/** Window size — resize cửa sổ/canvas để xem width × height cập nhật realtime. */
function WindowSizeDemo() {
  const { width, height } = useWindowSize();

  return (
    <div style={{ ...demoBox, gridAutoFlow: 'column', justifyContent: 'start' }}>
      <div style={{ ...demoMono, fontSize: 16, color: '#101828' }}>
        window: {width} × {height}px
      </div>
    </div>
  );
}

export const WindowSize: Story = {
  name: 'useWindowSize',
  render: () => <WindowSizeDemo />,
};
