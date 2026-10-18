// ChapterShell demo — generic chapter dùng shell SF-3 (label mono + title ALL-CAPS
// 29px/300 + parallax nền speed 0.08/strength 280 + gradient scrim tự chủ).
// Compose thật nằm ở index.stories (V2) — file này demo shell + SideNav riêng lẻ.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Card, CountUp } from '../../index';
import { ChapterShell } from './lib/ChapterShell.js';
import { SideNav } from './lib/SideNav.js';

const meta = { title: 'Experience/Chapter Shell', tags: ['autodocs'] } satisfies Meta;
export default meta;

type Story = StoryObj<typeof meta>;

/** GenericChapter — chương mẫu dùng ChapterShell: label/title/copy + children demo
 * (counter + card) đặt trên nền gradient parallax tự chủ. Cuộn để thấy nền trôi 0.08. */
export const GenericChapter: Story = {
  name: 'Generic chapter — shell + parallax bg + children demo',
  render: () => (
    <div className="min-h-screen bg-canvas">
      <SideNav />
      <ChapterShell
        id="ch-shell-demo"
        chapter="03"
        mood="velocity"
        title="TEAM VELOCITY"
        copy="Nhịp đập của đội thắm lại qua từng sprint — mọi con số phản ánh đúng trạng thái hiện tại."
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Card>
            <span className="text-[29px] font-light text-white">
              <CountUp value={62_210} duration={1.6} />
            </span>
            <span className="ml-2 text-meta text-white/60">giờ đóng góp</span>
          </Card>
          <Card>
            <Badge variant="doing">velocity</Badge>
            <span className="ml-2 text-meta text-white/60">1 hero moment / chương</span>
          </Card>
        </div>
      </ChapterShell>
    </div>
  ),
};
