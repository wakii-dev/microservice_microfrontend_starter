// Preview render primitives ĐÚNG ngữ cảnh design system: tokens + base css import
// toàn cục (idempotent — cùng cơ chế shell/standalone). Nền canvas tối theo direction B.
import '../src/styles/tokens.css';
import '../src/styles/base.css';

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    backgrounds: {
      default: 'canvas',
      values: [{ name: 'canvas', value: '#010102' }],
    },
  },
};
export default preview;
