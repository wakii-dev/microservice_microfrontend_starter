// Showcase About — giới thiệu kit. Thuộc feature `showcase` (xoá demo = xoá cả feature).
import { Card, Link, Tag, Text, Title } from '@wakii/ui-kit';

const EYEBROW = 'text-label font-semibold uppercase tracking-[0.1em] text-accent';

export function ShowcaseAbout() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className={EYEBROW}>About</span>
        <Title level={1}>A design system that scales with you</Title>
      </div>
      <div className="max-w-2xl">
        <Text type="secondary">
          <Text strong>@wakii/ui-kit</Text> is a Tailwind v4 design system: tokens-first theming (light/dark qua
          <Text code> data-bp-theme</Text>), antd/PrimeReact-parity components, hooks and motion — shipped as one
          npm package.
        </Text>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Storybook" extra={<Tag>live</Tag>}>
          <div className="flex flex-col gap-2">
            <Text type="secondary">Every component with knobs and docs — the living API reference.</Text>
            <Link href="https://storybook-static-khaki-two.vercel.app" target="_blank" rel="noreferrer">
              Open the playground
            </Link>
          </div>
        </Card>
        <Card title="npm package" extra={<Tag>latest</Tag>}>
          <div className="flex flex-col gap-2">
            <Text type="secondary">Install the kit in any Vite/React app and consume it via source.</Text>
            <Link href="https://www.npmjs.com/package/@wakii/ui-kit" target="_blank" rel="noreferrer">
              @wakii/ui-kit on npm
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
