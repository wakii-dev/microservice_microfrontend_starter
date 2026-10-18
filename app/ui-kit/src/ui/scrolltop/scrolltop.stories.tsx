// ScrollTop stories — window-scroll floating button, appears past a threshold.
// Component listens to window.scrollY (returns null while hidden).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { ScrollTop } from './index';

const meta = { title: 'Navigation/ScrollTop', component: ScrollTop, tags: ['autodocs'] } satisfies Meta<typeof ScrollTop>;
export default meta;
type S = StoryObj<typeof meta>;

function TallPage({ threshold }: { threshold?: number }) {
  return (
    <div>
      <p className="text-label text-ink3">
        Scroll the page (or click the button) — the floating pill appears after {threshold ?? 400}px.
      </p>
      <div className="my-3">
        <Button onClick={() => window.scrollTo({ top: 1200, behavior: 'smooth' })}>Scroll down ↓</Button>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-s2 p-3 text-body text-ink2">
            Filler block {i + 1}
          </div>
        ))}
      </div>
      <ScrollTop threshold={threshold} />
    </div>
  );
}

export const Default: S = {
  name: 'Default — appears after 400px (scroll to see)',
  render: () => <TallPage />,
};

export const CustomThreshold: S = {
  name: 'Custom threshold — appears after 1200px',
  render: () => <TallPage threshold={1200} />,
};
