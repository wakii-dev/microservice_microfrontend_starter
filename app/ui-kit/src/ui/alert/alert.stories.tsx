// Parity matrix antd→tokens: docs/parity-matrix.md
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from './index';

/** Inline status banner that stays in the page flow — filled by default. */
const meta = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: { type: { control: 'select', options: ['success', 'info', 'warning', 'error'] } },
} satisfies Meta<typeof Alert>;
export default meta;

type Story = StoryObj<typeof meta>;

export const FourTypes: Story = {
  name: '4 types — filled (default)',
  args: { message: 'Alert' },
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <Alert type="success" message="Changes saved." />
      <Alert type="info" message="Auth service is starting up — try again shortly." />
      <Alert type="warning" message="Token expires soon." />
      <Alert type="error" message="Incorrect email or password." />
    </div>
  ),
};

export const WithDescriptionAndClose: Story = {
  name: 'Description + closable — detail row + × button',
  args: {
    type: 'error',
    message: 'Cannot reach the tasks service.',
    description: 'Detail: fetch failed — node-svc (:3001) is not responding.',
    closable: true,
  },
};

export const Outlined: Story = {
  name: 'Outlined — tint bg + border + colored icon',
  args: { message: 'Alert' },
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <Alert variant="outlined" type="success" message="Changes saved." />
      <Alert variant="outlined" type="info" message="Auth service is starting up — try again shortly." />
      <Alert variant="outlined" type="warning" message="Token expires soon." />
      <Alert variant="outlined" type="error" message="Incorrect email or password." />
    </div>
  ),
};

export const CustomStyled: Story = {
  name: 'CustomStyled — classNames slots (antd v5 style)',
  args: { message: 'Alert' },
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <Alert
        type="info"
        message="Custom icon size + italic description"
        description="The description line is styled via classNames.description."
        closable
        classNames={{ icon: 'text-xl', description: 'italic' }}
      />
      <Alert
        type="success"
        message="Custom close button tint"
        closable
        classNames={{ closeButton: 'text-st-done' }}
      />
      <Alert
        variant="outlined"
        type="warning"
        message="Custom wrapper ring"
        classNames={{ wrapper: 'ring-1 ring-st-doing' }}
      />
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — filled tokens stay (WCAG by design), outlined tints switch',
  args: { message: 'Alert' },
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <Alert type="success" message="Changes saved." />
        <Alert type="info" message="Auth service is starting up — try again shortly." />
        <Alert variant="outlined" type="warning" message="Token expires soon." />
        <Alert variant="outlined" type="error" message="Incorrect email or password." />
      </div>
    </div>
  ),
};
