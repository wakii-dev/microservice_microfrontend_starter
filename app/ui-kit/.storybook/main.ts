import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories colocated cạnh primitives + 1 trang docs tokens ở src gốc
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  addons: ['@storybook/addon-docs'],
  docs: {},
  async viteFinal(config) {
    // Tailwind v4 — utilities của primitives (spec tailwind-migration P0)
    return {
      ...config,
      plugins: [...(config.plugins ?? []), tailwindcss()],
    };
  },
};
export default config;
