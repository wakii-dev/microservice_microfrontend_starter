// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Alert } from './index';
import { message } from '../message/index.js';

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

// ── Real-world usage (2026-10-25): save flow — inline Alert + toast Message ──

/** SaveFlow — form save: idle → saving (Button loading) → saved (Alert success) or
 * failed (Alert error + Retry). Toast `message` fires alongside each outcome — copy
 * this pattern for every form submit. */
export const SaveFlow: StoryObj = {
  name: 'Save flow — idle → loading → success / failure with retry',
  render: () => <SaveFlowDemo />,
};

function SaveFlowDemo() {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  function save() {
    setState('saving');
    window.setTimeout(() => {
      // demo: 75% thành công — nhấn lại để thấy nhánh còn lại
      if (Math.random() > 0.25) {
        setState('saved');
        message.success('Workspace settings saved');
      } else {
        setState('failed');
        message.error('Save failed — network error');
      }
    }, 1200);
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-line bg-s1 p-5">
      <span className="text-body font-medium text-ink">Workspace settings</span>
      <span className="text-meta text-ink3">Site name, timezone and notification defaults.</span>
      {state === 'failed' && (
        <Alert
          type="error"
          message="Couldn't save your changes"
          description="The network request failed — check the connection and try again."
        />
      )}
      {state === 'saved' && <Alert type="success" message="All changes saved" />}
      <div className="flex items-center gap-2">
        <Button type="primary" loading={state === 'saving'} onClick={save}>
          {state === 'failed' ? 'Retry save' : 'Save changes'}
        </Button>
        {state === 'saved' && (
          <Button type="text" onClick={() => setState('idle')}>
            Reset demo
          </Button>
        )}
      </div>
    </div>
  );
}
