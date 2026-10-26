// Stories ScrollPage — fullpage snap deck: Basic 3 sections · WithNav dots
// (nút chấm scrollIntoView — native smooth, respect reduced-motion của browser)
// · DarkTheme (data-bp-theme cascade). Tokens-only, EN.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/index';
import { Tag } from '../tag/index';
import { ScrollPage } from './index.js';

const meta = {
  title: 'Navigation/ScrollPage',
  component: ScrollPage,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollPage>;
export default meta;
type Story = StoryObj<typeof meta>;

function SectionBody({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="max-w-xl text-center">
      <Tag className="mb-3">{kicker}</Tag>
      <h2 className="m-0 text-h1 font-bold text-ink">{title}</h2>
      <p className="mb-0 mt-2 text-body text-ink2">{body}</p>
    </div>
  );
}

export const Basic: Story = {
  name: 'Basic — 3 fullpage sections',
  render: () => (
    <ScrollPage aria-label="Product deck" className="rounded-xl border border-line">
      <ScrollPage.Section id="deck-1" aria-label="Overview" className="bg-s1">
        <SectionBody kicker="01 — Overview" title="One screen, one idea" body="Each section snaps flush — no half-states, no scroll-hijack. Pure CSS scroll-snap." />
      </ScrollPage.Section>
      <ScrollPage.Section id="deck-2" aria-label="Workflow" className="bg-s2">
        <SectionBody kicker="02 — Workflow" title="Keyboard friendly" body="The deck is focusable — arrow keys scroll and snap exactly like touch or wheel." />
      </ScrollPage.Section>
      <ScrollPage.Section id="deck-3" aria-label="Wrap up" className="bg-s3">
        <SectionBody kicker="03 — Wrap up" title="Composable sections" body="ScrollPage.Section is a plain landmark — bring your own id, aria-label and content." />
      </ScrollPage.Section>
    </ScrollPage>
  ),
};

export const WithNavDots: Story = {
  name: 'With nav dots — fixed rail scrolls between sections',
  render: () => (
    <div className="relative">
      <div className="absolute right-3 top-1/2 z-[var(--z-dropdown)] flex -translate-y-1/2 flex-col gap-2">
        {['Overview', 'Workflow', 'Wrap up'].map((label, i) => (
          <Button
            key={label}
            size="small"
            onClick={() => {
              const deck = document.querySelector('[aria-label="Product deck with nav"]');
              deck?.querySelectorAll('section')[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            aria-label={`Go to ${label}`}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      <ScrollPage aria-label="Product deck with nav" className="rounded-xl border border-line">
        <ScrollPage.Section id="nav-1" aria-label="Overview" className="bg-s1">
          <SectionBody kicker="01" title="Overview" body="Dots call scrollIntoView on the section — snap does the rest." />
        </ScrollPage.Section>
        <ScrollPage.Section id="nav-2" aria-label="Workflow" className="bg-s2">
          <SectionBody kicker="02" title="Workflow" body="The rail floats above the deck with the standard dropdown z-index." />
        </ScrollPage.Section>
        <ScrollPage.Section id="nav-3" aria-label="Wrap up" className="bg-s3">
          <SectionBody kicker="03" title="Wrap up" body="Compose whatever nav you like — the deck only owns snapping." />
        </ScrollPage.Section>
      </ScrollPage>
    </div>
  ),
};

export const DarkTheme: Story = {
  name: 'Dark theme — data-bp-theme cascade',
  render: () => (
    <div data-bp-theme="dark">
      <ScrollPage aria-label="Dark deck" className="rounded-xl border border-line">
        <ScrollPage.Section id="dark-1" aria-label="Dark overview" className="bg-s1">
          <SectionBody kicker="dark" title="Same tokens, dark deck" body="No dark-specific code — the data-bp-theme attribute cascades through every token." />
        </ScrollPage.Section>
        <ScrollPage.Section id="dark-2" aria-label="Dark details" className="bg-s2">
          <SectionBody kicker="dark" title="Contrast audited" body="Surfaces, ink and lines all switch together — verified by the contrast audit." />
        </ScrollPage.Section>
      </ScrollPage>
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the snap
 * container (ScrollPage) and on each full-height <section> (ScrollPage.Section);
 * `style` flows through HTMLAttributes onto the same elements. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <ScrollPage
      aria-label="Slotted deck"
      classNames={{ root: 'rounded-xl ring-2 ring-accent/30' }}
      style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
      className="max-h-96 border border-line"
    >
      <ScrollPage.Section
        id="slot-1"
        aria-label="Slotted first"
        classNames={{ root: 'bg-accent/5' }}
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <SectionBody kicker="slots" title="Slotted deck" body="Container ring + section wash, default snap untouched." />
      </ScrollPage.Section>
      <ScrollPage.Section id="slot-2" aria-label="Slotted second" classNames={{ root: 'bg-s3' }}>
        <SectionBody kicker="slots" title="Second page" body="Scrolls and snaps the same way." />
      </ScrollPage.Section>
    </ScrollPage>
  ),
};
