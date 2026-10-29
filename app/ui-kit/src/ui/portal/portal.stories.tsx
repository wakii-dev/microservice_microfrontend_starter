// Portal stories — body mount vs custom container. Meta has NO `component:` because
// Portal children aren't renderable from args (progress.stories pattern, not button.stories).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Portal } from './index';

const meta = { title: 'Primitives/Portal', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** BodyPortal — children mount directly in document.body, outside the story's React subtree. */
export const BodyPortal: Story = {
  render: () => (
    <div>
      <div className="w-96 rounded-lg border border-line p-3">
        <p className="text-body">This bordered box is the story root.</p>
        <Portal>
          <p className="text-body font-medium text-st-doing">
            ⇦ I am portaled to document.body — inspect the DOM: I am a direct child of
            &lt;body&gt;, not of the box above (escape hatch for overlays).
          </p>
        </Portal>
        <p className="mt-2 text-label text-ink4">
          The portal paragraph renders AFTER the app root in body flow, even though it is
          declared inside the box.
        </p>
      </div>
    </div>
  ),
};

/** CustomContainer — portal into an adjacent bordered panel via element state. */
export const CustomContainer: Story = {
  render: () => {
    const [host, setHost] = useState<HTMLElement | null>(null);
    return (
      <div className="flex gap-4">
        <div className="w-64 rounded-lg border border-line p-3">
          <p className="mb-2 text-label text-ink4">Source — declares the Portal</p>
          <Portal container={host}>
            <p className="text-body font-medium text-accent">
              Rendered via Portal into the TARGET panel →
            </p>
          </Portal>
        </div>
        <div ref={setHost} className="w-64 rounded-lg border-2 border-accent p-3">
          <p className="mb-2 text-label text-ink4">Target — bordered container</p>
        </div>
      </div>
    );
  },
};
