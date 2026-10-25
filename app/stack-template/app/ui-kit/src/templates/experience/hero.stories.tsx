// Templates/Cinematic Experience/Hero — SF-2 standalone demo (PO: "giàu lớp").
// Atlas 1280: bố cục 9 lớp parallax (lưới blueprint · starfield · sun góc · ghost
// LIGHTYEAR · 4 chip nổi · display) giống ref-hero.png; Dark: CHỈ hạt sao đảo màu
// bông tuyết light (--navy-ink flip) — nền atlas VẪN sáng cố định (contract §2,
// --hero-ink không flip). Mobile 375: soi bằng viewport thật (evidence playwright
// 2026-10-19-cin-sf2-hero-375.png) — clusters stack flow, chips/ghost ẩn <lg.
import type { Meta, StoryObj } from '@storybook/react-vite';
import Hero from './chapters/hero';

const meta = {
  title: 'Templates/Cinematic Experience/Hero',
  tags: ['autodocs'],
  component: Hero,
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Atlas: Story = {
  name: 'Hero — atlas 9 lớp (ref-hero 1280)',
  render: () => <Hero />,
};

export const DarkSnow: Story = {
  name: 'Hero — dark: bông tuyết light, nền atlas vẫn sáng cố định',
  globals: { theme: 'dark' },
  render: () => <Hero />,
};
