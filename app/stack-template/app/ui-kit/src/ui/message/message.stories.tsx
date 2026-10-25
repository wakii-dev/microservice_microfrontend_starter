// Parity matrix antd→tokens: docs/parity-matrix.md
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { message } from './index';

/** Transient global toast — static API, 3s auto-dismiss. */
const meta = {
  title: 'Feedback/Message',
  tags: ['autodocs'],
} satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

export const FourTypes: Story = {
  name: '4 types — success/info/warning/error',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button type="primary" onClick={() => message.success('Task deleted')}>
        success
      </Button>
      <Button onClick={() => message.info('Feed synced')}>info</Button>
      <Button onClick={() => message.warning('Token expires soon')}>warning</Button>
      <Button type="primary" danger onClick={() => message.error('Cannot reach node-svc')}>
        error
      </Button>
    </div>
  ),
};

export const RapidFire: Story = {
  name: 'Stack — click repeatedly → toasts queue up',
  render: () => (
    <Button type="primary" onClick={() => message.info(`Update #${Date.now() % 1000}`)}>
      Fire 3 toasts in a row
    </Button>
  ),
};

export const CustomStyled: Story = {
  name: 'CustomStyled — classNames slots (antd v5 style)',
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button
        type="primary"
        onClick={() => message.success('Green tinted toast', { wrapper: 'ring-1 ring-st-done' })}
      >
        wrapper slot
      </Button>
      <Button
        onClick={() => message.info('Bigger icon + bold text', { icon: 'text-xl', content: 'font-bold' })}
      >
        icon + content slots
      </Button>
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'DarkTheme — toast bg-s2 + dark border-line',
  render: () => (
    <div data-bp-theme="dark" className="p-4">
      <Button type="primary" onClick={() => message.success('Saved (dark scope)')}>success (dark)</Button>
    </div>
  ),
};

// ── Real-world usage (2026-10-25): save flow toasts ──

/** SaveFlowToasts — toast layer of a form save: info while saving, then success or
 * error. Pair with the inline Alert story "Save flow" in Feedback/Alert. */
export const SaveFlowToasts: Story = {
  name: 'Save flow toasts — info while saving, success/error on finish',
  render: () => <SaveFlowToastsDemo />,
};

function SaveFlowToastsDemo() {
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle');

  function save() {
    setState('saving');
    message.info('Saving workspace settings…');
    window.setTimeout(() => {
      setState('done');
      if (Math.random() > 0.25) message.success('Workspace settings saved');
      else message.error('Save failed — network error');
    }, 1200);
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-line bg-s1 p-5">
      <span className="text-body font-medium text-ink">Workspace settings</span>
      <span className="text-meta text-ink3">
        Toasts appear top-center and auto-dismiss after 3s — hit save a few times to catch both endings.
      </span>
      <div>
        <Button type="primary" loading={state === 'saving'} onClick={save}>
          {state === 'done' ? 'Save again' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
