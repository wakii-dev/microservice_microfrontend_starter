// Manager UI theme — "Đồng bộ ui-kit": chrome Storybook map 1:1 tokens
// styles/tokens.css (antd-look light) + themes/dark.css — Storybook mặc đúng
// áo của design system nó documenting. Nguồn giá trị ghi cạnh mỗi key; đổi
// token ở tokens.css/dark.css = đổi ở đây cùng commit.
// Chi tiết selector-spezifisch (sidebar item/search/scrollbar) ở manager-head.html.
// Dark đồng bộ toolbar toggle: nghe GLOBALS_UPDATED (addon-themes) — bấm dark
// trên toolbar là cả manager (sidebar/toolbar) theo canvas (2026-10-23).
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import { GLOBALS_UPDATED } from 'storybook/internal/core-events';

// Font stacks — mirror --f / --m (tokens.css)
const FONT_BASE =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';
const FONT_MONO =
  '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';

// Brand — Mark chữ W (khối accent bo r-1) + wordmark ghép trong 1 SVG
// (brandImage thay brandTitle trong sidebar header). Mực wordmark + accent
// mark theo palette để đọc được trên cả 2 nền sidebar.
function brandImage(ink: string, accent: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="24" viewBox="0 0 128 24"><rect width="24" height="24" rx="6" fill="${accent}"/><path d="M5.5 8l2.6 8L10.7 10.4 13.3 16l2.6-8" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="32" y="16.5" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif" font-size="14" font-weight="600" fill="${ink}">Wakii UI Kit</text></svg>`,
  )}`;
}

// 2 palette — giá trị mirror tokens.css (light) / themes/dark.css (dark).
const PALETTES = {
  light: {
    base: 'light' as const,
    // Accent — --accent / --accent-hi
    colorPrimary: '#1677ff',
    colorSecondary: '#4096ff',
    // Nền khung — --c-canvas (sidebar) / --c-s2 (content)
    appBg: '#f5f5f5',
    appContentBg: '#ffffff',
    // Viền — --line (cool-tint hairline)
    appBorderColor: '#e2e5ea',
    // Toolbar — khối --c-s1, chữ --ink2
    barBg: '#ffffff',
    barTextColor: 'rgba(0, 0, 0, 0.65)',
    barSelectedColor: '#1677ff',
    barHoverColor: '#4096ff',
    // Mực — 4 mức antd colorText
    textColor: 'rgba(0, 0, 0, 0.88)',
    textInverseColor: '#ffffff',
    textMutedColor: 'rgba(0, 0, 0, 0.45)',
    // Inputs (search box...) — nền --c-s3
    inputBg: '#fafafa',
    inputBorder: '#e2e5ea',
    inputTextColor: 'rgba(0, 0, 0, 0.88)',
    // Buttons — mirror Button default (nền s2 viền line)
    buttonBg: '#ffffff',
    buttonBorder: '#e2e5ea',
    brandImage: brandImage('rgba(0,0,0,0.88)', '#1677ff'),
  },
  dark: {
    base: 'dark' as const,
    colorPrimary: '#5e6ad2', // --accent
    colorSecondary: '#828fff', // --accent-hi
    appBg: '#010102', // --c-canvas
    appContentBg: '#141516', // --c-s2
    appBorderColor: '#23252a', // --line
    barBg: '#0f1011', // --c-s1
    barTextColor: '#d0d6e0', // --ink2
    barSelectedColor: '#828fff', // --accent-hi (đọc được trên nền tối)
    barHoverColor: '#5e6ad2', // --accent
    textColor: '#f7f8f8', // --ink
    textInverseColor: '#010102',
    textMutedColor: '#8a8f98', // --ink3
    inputBg: '#18191a', // --c-s3
    inputBorder: '#23252a',
    inputTextColor: '#f7f8f8',
    buttonBg: '#141516', // --c-s2
    buttonBorder: '#23252a',
    brandImage: brandImage('#f7f8f8', '#5e6ad2'),
  },
};

function applyManagerTheme(globals?: Record<string, unknown>): void {
  const theme = (globals?.theme as string | undefined) === 'dark' ? 'dark' : 'light';
  // Attr trên body manager để manager-head.html chỉnh iframe/overlay theo
  // (manager scope không có tokens var nên CSS ở đó dùng hex kèm comment nguồn).
  if (typeof document !== 'undefined' && document.body) {
    document.body.setAttribute('data-bp-theme', theme);
  }
  addons.setConfig({
    theme: create({
      ...PALETTES[theme],
      brandTitle: 'Wakii UI Kit',
      brandUrl: 'https://storybook-static-khaki-two.vercel.app',
      appBorderRadius: 8, // --r-2
      fontBase: FONT_BASE,
      fontCode: FONT_MONO,
    }),
  });
}

// Boot: theme có thể nằm sẵn trong URL (?globals=theme:dark) — manager không
// nhận lại event cho giá trị initial nên tự đọc query string.
{
  const q = new URLSearchParams(window.location.search).get('globals') ?? '';
  applyManagerTheme(/(^|,)theme:dark(,|$)/.test(q) ? { theme: 'dark' } : undefined);
}
// Toggle runtime trên toolbar.
addons.getChannel().on(GLOBALS_UPDATED, ({ globals }: { globals?: Record<string, unknown> }) => {
  applyManagerTheme(globals);
});

// Ẩn teaser SB "Learn what's new" ở đáy sidebar — class là emotion-hash
// (đổi mỗi build) nên match theo nội dung; MutationObserver phòng render
// muộn sau boot. (SB strip <script> inline khỏi manager-head nên phải ở đây.)
function hideVersionTeaser(): void {
  const els = document.querySelectorAll<HTMLElement>('nav div, aside div, #root div');
  for (const el of els) {
    const text = (el.textContent ?? '').trim();
    if (text.includes("Learn what's new") && text.length < 120) {
      el.style.display = 'none';
    }
  }
}
if (typeof document !== 'undefined') {
  hideVersionTeaser();
  if (document.body) {
    new MutationObserver(hideVersionTeaser).observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      hideVersionTeaser();
      new MutationObserver(hideVersionTeaser).observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }
}
