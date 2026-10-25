// Switch stories — Basic / Small / WithLabels (ON-OFF cross-fade) / Disabled / DarkTheme.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from '../slider/index';
import { Switch } from './index';

/** Instant on/off toggle — `role=switch` + `aria-checked` built in. */
const meta = { title: 'Forms/Switch', component: Switch, tags: ['autodocs'] } satisfies Meta<typeof Switch>;
export default meta;
type S = StoryObj<typeof meta>;

function Toggle({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <Switch checked={on} onChange={setOn} aria-label="Toggle demo" />;
}

export const Basic: S = {
  name: 'Basic — gradient + spring pop',
  render: () => <Toggle />,
};

export const Small: S = {
  name: 'Small 36×16',
  render: () => (
    <div className="flex items-center gap-3">
      <Switch size="small" aria-label="Small 1" />
      <Switch size="small" checked aria-label="Small 2" />
    </div>
  ),
};

function WithLabelsDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-3">
      <Switch checked={on} onChange={setOn} checkedChildren="ON" unCheckedChildren="OFF" aria-label="With labels" />
      <span className="text-meta text-ink2">{on ? 'On' : 'Off'}</span>
    </div>
  );
}

export const WithLabels: S = {
  name: 'WithLabels — ON/OFF cross-fade 150ms',
  render: () => <WithLabelsDemo />,
};

export const Disabled: S = {
  name: 'Disabled — flat, no handle shadow',
  render: () => (
    <div className="flex items-center gap-3">
      <Switch disabled aria-label="Disabled off" />
      <Switch disabled checked aria-label="Disabled on" />
    </div>
  ),
};

function ControlledDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="grid max-w-[320px] gap-3">
      <Switch checked={on} onChange={setOn} />
      <p className="m-0 font-mono text-meta text-ink3">checked: <strong className="text-ink">{String(on)}</strong></p>
    </div>
  );
}

/** Controlled — useState demo: flip updates state. */
export const Controlled: S = {
  render: () => <ControlledDemo />,
};

export const DarkTheme: S = {
  name: 'Dark theme',
  /* Soft bg-s2 card (dark = muted gray) like a real card surface — not a harsh
   * near-black box on the light canvas (user feedback). */
  render: () => (
    <div data-bp-theme="dark" className="inline-flex items-center gap-4 rounded-xl bg-s2 p-4">
      <Switch checked aria-label="Dark 1" />
      <Switch aria-label="Dark 2" />
      <Switch checked size="small" aria-label="Dark 3" />
    </div>
  ),
};


/* ── Real-world cases (mission #13 — real-world stories sweep) ── */

// Local wrapper — settings page: notification switches + volume slider.
function SettingsPanelInner() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [volume, setVolume] = useState(40);
  return (
    <div className="flex w-96 max-w-full flex-col gap-5 rounded-xl border border-line bg-s1 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-body text-ink">Email notifications</span>
          <span className="text-meta text-ink3">Weekly digest and security alerts</span>
        </div>
        <Switch checked={emailNotif} onChange={setEmailNotif} aria-label="Email notifications" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-body text-ink">Auto-update apps</span>
          <span className="text-meta text-ink3">Install updates without asking</span>
        </div>
        <Switch checked={autoUpdate} onChange={setAutoUpdate} aria-label="Auto-update apps" />
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <span className="text-body text-ink">Volume</span>
          <span className="text-meta tabular-nums text-ink2">{volume}%</span>
        </div>
        <Slider value={volume} onChange={setVolume} min={0} max={100} ariaLabel="Volume" />
      </div>
    </div>
  );
}

export const SettingsPanel: S = {
  name: 'SettingsPanel — settings page: toggles + volume slider',
  render: () => <SettingsPanelInner />,
};
