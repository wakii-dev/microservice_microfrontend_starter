// Preview render primitives ĐÚNG ngữ cảnh design system: tokens (antd-look light
// default) + base css + tailwind utilities (@tailwindcss/vite — main.ts).
// Dark theme qua toolbar toggle (addon-themes — đặt `data-bp-theme="dark"` lên
// <html>, đúng rule AGENTS.md; tokens.css tự import themes/dark.css nên không
// cần import thêm ở đây). Canvas padding chuẩn 24px qua preview-head.html.
import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { addons } from 'storybook/internal/preview-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import './tailwind-preview.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';

// Trang docs MDX thuần (Introduction, Intro/Showcase) không render story nào
// → decorator withThemeByDataAttribute không chạy → body mất data-bp-theme,
// canvas kẹt light dù toolbar đang dark (bug thấy 2026-10-23). Sync attr trực
// tiếp theo globals trên channel: SET_GLOBALS lúc iframe boot (initial globals
// từ URL ?globals=theme:dark), GLOBALS_UPDATED khi user bấm toggle toolbar.
type GlobalsPayload = { globals?: Record<string, unknown> };
const syncBodyTheme = ({ globals }: GlobalsPayload): void => {
  const theme = (globals?.theme as string | undefined) ?? 'light';
  document.body.setAttribute('data-bp-theme', theme);
};
const channel = addons.getChannel();
channel.on(SET_GLOBALS, syncBodyTheme);
channel.on(GLOBALS_UPDATED, syncBodyTheme);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Iframe standalone là 1 trang không main/h1/landmark — 3 rule PAGE-SCAFFOLD
      // (axe: landmark-one-main, page-has-heading-one, region) đánh vào khung xem,
      // không phải component (audit 3D 21:58 xác nhận). Component vẫn bị audit
      // đầy đủ các rule còn lại (contrast, aria, name...).
      rules: [
        { id: 'landmark-one-main', enabled: false },
        { id: 'page-has-heading-one', enabled: false },
        { id: 'region', enabled: false },
      ],
    },
  },
  decorators: [
    withThemeByDataAttribute<Preview>({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-bp-theme',
      // 'body' thay vì 'html' mặc định: tokens.css khai light trong `:root` (line
      // 13) SAU khi @import dark.css (line 11) — cùng specificity 0-1-0, rule sau
      // thắng ⇒ trên <html> light đè dark. <body> không match :root → dark thắng,
      // var cascade xuống toàn canvas (đúng rule AGENTS: html HOẶC node bao).
      parentSelector: 'body',
    }),
  ],
};

export default preview;
