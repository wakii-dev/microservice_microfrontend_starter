// experience3d stories — WebGL cinematic: tàu procedural + flythrough camera.
// Peer-dep three (consumer tự cài) — thiếu → fallback node; reduced-motion →
// 1 frame tĩnh (toggle "reducedMotion" control để so sánh).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Scene3D, ScrollFlythrough, ShipModel } from './index';

const meta = { title: 'Theming & Motion/Experience 3D', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj;

/** ShipModel — kéo xoay 360 (thả còn quán tính), auto-rotate idle chậm. */
export const ShipModelShowcase: Story = {
  name: 'ShipModel — procedural ship, drag + inertia',
  render: () => (
    <div data-bp-theme="dark" className="flex flex-col gap-3 rounded-xl bg-canvas p-2">
      <ShipModel className="w-full" height={440} />
      <span className="text-meta text-ink3">
        Kéo chuột trên canvas để xoay — thả ra còn quán tính ~1s rồi auto-rotate idle chậm. Kích
        nút khi WebGL/peer-dep thiếu → fallback.
      </span>
    </div>
  ),
};

/** Flythrough — camera bay theo progress; kéo slider để điều khiển (0→1). */
export const FlythroughDemo: Story = {
  name: 'ScrollFlythrough — camera CatmullRom theo progress',
  render: () => <FlythroughPlayground />,
};

function FlythroughPlayground() {
  const [progress, setProgress] = useState(0.15);
  return (
    <div data-bp-theme="dark" className="flex flex-col gap-3 rounded-xl bg-canvas p-2">
      <ScrollFlythrough className="w-full" height={460} progress={progress} />
      <label className="flex items-center gap-3 text-meta text-ink3">
        progress (điểm camera trên CatmullRom 4 điểm)
        <input
          type="range"
          min={0}
          max={0.999}
          step={0.001}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer accent-[var(--accent)]"
        />
        <span className="w-10 text-right font-mono text-ink">{progress.toFixed(2)}</span>
      </label>
      <span className="text-meta text-ink3">
        Trong website Cinematic, progress này nối từ section progress của chương (0→1 khi cuộn qua
        200vh) — component độc lập, không scroll-hijack.
      </span>
    </div>
  );
}

/** Scene3D — stage thuần: lighting 3 điểm + fog + starfield (không chủ thể). */
export const SceneOnly: Story = {
  name: 'Scene3D — starfield stage thuần',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-2">
      <Scene3D className="w-full" height={380} />
    </div>
  ),
};

/** CustomStyled — slots-wave classNames + style: `root` lands on the host div
 * that holds the WebGL canvas; `style` merges after the height inline style. */
export const CustomStyled: Story = {
  name: 'CustomStyled (classNames + style)',
  render: () => (
    <div data-bp-theme="dark" className="rounded-xl bg-canvas p-2">
      <ShipModel
        height={320}
        classNames={{ root: 'ring-2 ring-accent/30' }}
        style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)' }}
        className="w-full"
      />
    </div>
  ),
};
