// Manager UI theme — brand Wakii UI Kit, accent ăn token --accent (antd look).
// manager-head.html (badge) giữ nguyên — chỉ đổi theme qua manager-api.
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',

    // Brand
    brandTitle: 'Wakii UI Kit',
    brandUrl: 'https://storybook-static-khaki-two.vercel.app',

    // Accent theo token --accent / --accent-hi (styles/tokens.css)
    colorPrimary: '#1677ff',
    colorSecondary: '#4096ff',
  }),
});
