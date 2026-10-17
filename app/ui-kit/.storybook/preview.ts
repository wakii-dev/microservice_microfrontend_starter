// Preview render primitives ĐÚNG ngữ cảnh design system: tokens (antd-look light
// default) + base css + tailwind utilities (@tailwindcss/vite — main.ts). Dark theme
// demo qua story riêng (data-bp-theme='dark' — themes/dark.css).
import './tailwind-preview.css';
import '../src/styles/tokens.css';
import '../src/styles/base.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    backgrounds: {
      default: 'canvas-light',
      values: [
        { name: 'canvas-light', value: '#f5f5f5' },
        { name: 'canvas-dark', value: '#010102' },
      ],
    },
  },
};
export default preview;
