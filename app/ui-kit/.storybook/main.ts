import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories colocated cạnh primitives + trang docs mở đầu (intro) + tokens ở src gốc
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  docs: {},
  // Introduction (docs mở đầu) đỉnh sidebar, rồi Design Tokens → nhóm component
  options: {
    storySort: {
      method: 'alphabetical',
      order: ['Introduction', 'Design Tokens', 'Theming & Motion', 'Data Display', 'Forms', 'Feedback', 'Navigation', 'Primitives', 'Hooks', 'General', 'Kitchen Sink'],
      includeName: true,
    },
  },
  async viteFinal(config) {
    // Tailwind v4 — utilities của primitives (spec tailwind-migration P0)
    return {
      ...config,
      plugins: [...(config.plugins ?? []), tailwindcss()],
    };
  },
};
export default config;
