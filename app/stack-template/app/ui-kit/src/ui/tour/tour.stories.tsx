// Tour stories — spotlight mask + step panel over a mock settings page.
// Steps target real DOM nodes by selector (#tour-*), so the spotlight lands
// with true rects in the browser. Open via the Start button per story.
import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index.js';
import { Switch } from '../switch/index.js';
import { Tour } from './index';

const meta = { title: 'Feedback/Tour', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Mock page the tour walks through — targets are the ids on these rows. */
function SettingsCard() {
  const [dark, setDark] = useState(false);
  return (
    <div className="w-[360px] rounded-xl border border-line bg-s1 p-5">
      <h3 className="m-0 text-h3 font-semibold text-ink">Workspace settings</h3>
      <div id="tour-profile" className="mt-4 flex items-center justify-between rounded-lg bg-s2 px-3 py-2.5">
        <div>
          <div className="text-body font-medium text-ink">Display name</div>
          <div className="text-meta text-ink3">Shown on tasks and comments</div>
        </div>
      </div>
      <div id="tour-appearance" className="mt-3 flex items-center justify-between rounded-lg bg-s2 px-3 py-2.5">
        <div>
          <div className="text-body font-medium text-ink">Dark mode</div>
          <div className="text-meta text-ink3">Tokens cascade automatically</div>
        </div>
        <Switch checked={dark} onChange={setDark} aria-label="Dark mode" />
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="primary" size="small" id="tour-save">
          Save changes
        </Button>
      </div>
    </div>
  );
}

const SETTINGS_STEPS = [
  {
    target: '#tour-profile',
    title: 'Your identity',
    description: 'Set the display name teammates see on tasks and comments.',
  },
  {
    target: '#tour-appearance',
    title: 'Pick a theme',
    description: 'Dark mode recolors the whole workspace — no per-component work needed.',
  },
  {
    target: '#tour-save',
    title: 'Save when done',
    description: 'Changes apply after you save. Click anywhere on the dimmed area to end the tour.',
  },
];

/** Basic — 3-step guided tour over a mock settings page. */
export const Basic: Story = {
  name: 'Basic — spotlight steps over a settings page',
  render: () => <BasicTourDemo />,
};

/** Controlled — current + onCurrentChange owned by the consumer. */
export const Controlled: Story = {
  name: 'Controlled — current state owned by the app',
  render: () => <ControlledTourDemo />,
};

/** CenteredIntro — steps without a target render a centered panel (intro/outro). */
export const CenteredIntro: Story = {
  name: 'Centered — targetless intro/outro steps',
  render: () => <CenteredTourDemo />,
};

/** DarkTheme — tour panel + spotlight on the dark canvas. */
export const DarkTheme: Story = {
  name: 'Dark theme',
  render: () => <DarkTourDemo />,
};

function TourFrame({ children, open, onStart }: { children: ReactNode; open: boolean; onStart: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex items-center gap-3">
        <Button type="primary" onClick={onStart} disabled={open}>
          Start tour
        </Button>
        <span className="text-meta text-ink3">ESC or click the dimmed area exits; Prev/Next walk the steps.</span>
      </div>
      <SettingsCard />
      {children}
    </div>
  );
}

function BasicTourDemo() {
  const [open, setOpen] = useState(false);
  return (
    <TourFrame open={open} onStart={() => setOpen(true)}>
      <Tour steps={SETTINGS_STEPS} open={open} onClose={() => setOpen(false)} />
    </TourFrame>
  );
}

function ControlledTourDemo() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  return (
    <TourFrame open={open} onStart={() => { setCurrent(0); setOpen(true); }}>
      <div className="font-mono text-meta text-ink3">
        current: <strong className="text-ink">{current}</strong>
      </div>
      <Tour
        steps={SETTINGS_STEPS}
        open={open}
        current={current}
        onCurrentChange={setCurrent}
        onClose={() => setOpen(false)}
      />
    </TourFrame>
  );
}

function CenteredTourDemo() {
  const [open, setOpen] = useState(false);
  return (
    <TourFrame open={open} onStart={() => setOpen(true)}>
      <Tour
        steps={[
          { title: 'Welcome to the workspace', description: 'A 2-stop quick look — centered panels bookend a targeted step.' },
          ...SETTINGS_STEPS.slice(0, 1),
          { title: "You're all set", description: 'Replay any time from the Start button above.' },
        ]}
        open={open}
        onClose={() => setOpen(false)}
      />
    </TourFrame>
  );
}

function DarkTourDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-4">
      <TourFrame open={open} onStart={() => setOpen(true)}>
        <Tour steps={SETTINGS_STEPS} open={open} onClose={() => setOpen(false)} />
      </TourFrame>
    </div>
  );
}
