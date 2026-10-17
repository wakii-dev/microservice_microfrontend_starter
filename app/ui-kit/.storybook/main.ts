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
};
export default config;
