// Message — toast gọn kiểu antd message (static API: message.success('…')).
// Container tự tạo 1 lần (portal-free: div fixed gắn body khi gọi đầu tiên);
// auto-dismiss 3s + motion slide-down. KHÔNG thay Alert cho error cần hiển thị lâu.
// SÓNG-3: classNames slots (wrapper/icon/content) — merge sau class mặc định.
// Customize pass (slots wave 3): ghép slot qua package classnames (bỏ slot helper).
import classNames from 'classnames';
import type { AlertType } from '../alert/index';

export type MessageType = Exclude<AlertType, 'warning'> | 'warning';

/** antd v5-style sub-part slot classes — merge AFTER defaults (consumer appends). */
export interface MessageClassNames {
  /** Toast root. */
  wrapper?: string;
  /** Status glyph span. */
  icon?: string;
  /** Content span. */
  content?: string;
}


// Path data GỐC primeicons 7.0.0 (style sweep 2026-10-23 — bỏ glyph ký tự text).
// Copy từ src/ui/icons/index.tsx (PATHS không export; file này DOM thuần không
// React) — dựng svg bằng createElementNS, KHÔNG innerHTML (đồng bộ kỷ luật
// textContent cho user content ở dưới).
const STATUS_PATHS: Record<MessageType, string[]> = {
  success: [
    'M9,18.25A.74.74,0,0,1,8.47,18l-5-5A.75.75,0,1,1,4.53,12L9,16.44,19.47,6A.75.75,0,0,1,20.53,7l-11,11A.74.74,0,0,1,9,18.25Z',
  ],
  info: [
    'M12,16.75a.76.76,0,0,1-.75-.75V11a.75.75,0,0,1,1.5,0v5A.76.76,0,0,1,12,16.75Z',
    'M12,9.25a.76.76,0,0,1-.75-.75V8a.75.75,0,0,1,1.5,0v.5A.76.76,0,0,1,12,9.25Z',
    'M12,21a9,9,0,1,1,9-9A9,9,0,0,1,12,21ZM12,4.5A7.5,7.5,0,1,0,19.5,12,7.5,7.5,0,0,0,12,4.5Z',
  ],
  warning: [
    'M20,18.75H4a.76.76,0,0,1-.65-.37.77.77,0,0,1,0-.75l8-14a.78.78,0,0,1,1.3,0l8,14a.77.77,0,0,1,0,.75A.76.76,0,0,1,20,18.75ZM5.29,17.25H18.71L12,5.51Z',
    'M12,13.25a.76.76,0,0,1-.75-.75V9a.75.75,0,0,1,1.5,0v3.5A.76.76,0,0,1,12,13.25Z',
    'M12,16.25a.76.76,0,0,1-.75-.75V15a.75.75,0,0,1,1.5,0v.5A.76.76,0,0,1,12,16.25Z',
  ],
  error: [
    'M13.06,12l4.42-4.42a.75.75,0,1,0-1.06-1.06L12,10.94,7.58,6.52A.75.75,0,0,0,6.52,7.58L10.94,12,6.52,16.42a.75.75,0,0,0,0,1.06.75.75,0,0,0,1.06,0L12,13.06l4.42,4.42a.75.75,0,0,0,1.06,0,.75.75,0,0,0,0-1.06Z',
  ],
};

/** SVG inline mirror markup bộ Icon (viewBox 24, fill currentColor, aria-hidden). */
function statusIcon(type: MessageType, size = 14): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('focusable', 'false');
  for (const d of STATUS_PATHS[type]) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  return svg;
}

const COLOR: Record<MessageType, string> = {
  success: 'text-st-done',
  info: 'text-accent',
  warning: 'text-st-doing',
  error: 'text-st-fail',
};

let container: HTMLDivElement | null = null;

function ensureContainer(): HTMLDivElement {
  // isConnected guard: container có thể bị detach (cleanup test / HMR) — tái tạo
  if (!container || !container.isConnected) {
    container = document.createElement('div');
    container.className = 'pointer-events-none fixed inset-x-0 top-4 z-[var(--z-toast)] flex flex-col items-center gap-2';
    document.body.appendChild(container);
  }
  return container;
}

function show(type: MessageType, content: string, durationMs = 3000, slots?: MessageClassNames): void {
  const root = ensureContainer();
  const el = document.createElement('div');
  el.className = classNames(
    'pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-s2 px-3 py-2 text-body text-ink shadow-[var(--shadow-pop)]',
    slots?.wrapper,
  );
  el.setAttribute('role', 'status');
  // DOM API + textContent — KHÔNG innerHTML (content có thể là input user → XSS surface)
  const icon = document.createElement('span');
  icon.className = classNames('text-label', COLOR[type], slots?.icon);
  icon.setAttribute('aria-hidden', 'true');
  icon.append(statusIcon(type));
  const text = document.createElement('span');
  text.className = classNames(slots?.content);
  text.textContent = content;
  el.append(icon, text);
  root.appendChild(el);
  // motion 12 standalone: animate qua Web Animations (không cần React root)
  // WAAPI — jsdom test không có Element.animate → guard (toast vẫn remove đúng)
  if (typeof el.animate === 'function') {
    el.animate(
      [
        { opacity: 0, transform: 'translateY(-12px) scale(0.97)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 180, easing: 'ease-out' },
    );
  }
  window.setTimeout(() => {
    if (typeof el.animate === 'function') {
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-in' }).onfinish =
        () => el.remove();
    } else {
      el.remove();
    }
  }, durationMs);
}

export const message = {
  success: (content: string, slots?: MessageClassNames) => show('success', content, 3000, slots),
  info: (content: string, slots?: MessageClassNames) => show('info', content, 3000, slots),
  warning: (content: string, slots?: MessageClassNames) => show('warning', content, 3000, slots),
  error: (content: string, slots?: MessageClassNames) => show('error', content, 3000, slots),
};

