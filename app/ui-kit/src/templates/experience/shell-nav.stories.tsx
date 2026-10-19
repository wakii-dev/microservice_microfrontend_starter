// Templates/Cinematic Shell + Nav — SF-3 demo: ChapterShell × 5 chương nội dung
// thật (Orca-flavored, KHÔNG placeholder-generic — bản generic đã bị PO gỡ) +
// MoodBackdrop crossfade 6 mood (SF-1) + SideNav scroll-spy 5 mục.
// Kiến trúc mood: sections trong suốt + backdrop fixed crossfade (contract §2) —
// cuộn tới đâu mood đổi tới đó, nav aria-current chạy theo section chạm mép.
// Verify: nav active chuyển đúng 5 mục khi cuộn; mood focus/docs/velocity/ship
// tối → future sáng (tone light); label/title/copy đúng số đo contract §1.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CountUp } from '../../index';
import { ChapterShell } from './lib/ChapterShell.js';
import { MoodBackdrop, MOOD_STOPS } from './lib/scroll-mood.js';
import { SideNav } from './lib/SideNav.js';

const meta = { title: 'Templates/Cinematic Shell + Nav', tags: ['autodocs'] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Stat mono gọn — nhịp demo cho children shell (không đụng scope nội dung chương).
 * value mode: số 30px tabular (band meta §1) + label mono; prefix mode: toàn mono 11px.
 * light: ink theme-flip cho band sáng (đồng bộ tone của ChapterShell — §2 mood future). */
function ShellStat({
  value,
  label,
  prefix,
  light,
}: {
  value?: number;
  label: string;
  prefix?: string;
  light?: boolean;
}) {
  return (
    <p
      className={`m-0 mt-8 flex flex-wrap items-baseline gap-x-3 font-mono text-[11px] font-bold uppercase tracking-[2.64px] ${
        light ? 'text-ink2' : 'text-white/85'
      }`}
    >
      {prefix && <span>{prefix}</span>}
      {value !== undefined && (
        <span className={`text-[30px] font-bold tabular-nums tracking-normal ${light ? 'text-ink' : 'text-white'}`}>
          <CountUp value={value} duration={1.2} format={(n) => n.toLocaleString('vi-VN')} />
        </span>
      )}
      <span>{label}</span>
    </p>
  );
}

function ShellNavPage() {
  return (
    <div className="relative">
      <MoodBackdrop stops={MOOD_STOPS} />
      <SideNav />

      <ChapterShell
        id="ch1"
        chapter="01"
        mood="focus"
        title="Deep focus"
        copy="Mỗi block tập trung được log thành worklog — không dựa cảm hứng, chỉ còn hạ tầng. Con số chạy khi bạn cuộn."
      >
        <ShellStat value={62210} label="giờ tập trung" />
      </ChapterShell>

      <ChapterShell
        id="ch2"
        chapter="02"
        mood="docs"
        title="Living docs"
        copy="Spec và task là một: tài liệu sống cập nhật theo từng commit, không ai phải nhắc ai."
      >
        <ShellStat prefix="24/7" label="docs đồng bộ theo commit" />
      </ChapterShell>

      <ChapterShell
        id="ch3"
        chapter="03"
        mood="velocity"
        title="Team velocity"
        copy="Nhịp đội hiện rõ từng sprint — cycle time, review latency, velocity thật chứ không phô trương."
      >
        <ShellStat value={9} label="sprint liên tiếp đúng hẹn" />
      </ChapterShell>

      <ChapterShell
        id="ch4"
        chapter="04"
        mood="ship"
        title="Ship your app"
        copy="Từ nhánh sang production trong một đường bay — ship thật, không demo suông."
      >
        <ShellStat value={15} label="bước e2e xanh mỗi convergence" />
      </ChapterShell>

      <ChapterShell
        id="ch5"
        chapter="05"
        mood="future"
        title="Future"
        copy="Hạ tầng đã trẻ lại: agent giao việc, người giữ nhịp. Chương kế tiếp do bạn viết."
        tone="light"
      >
        <ShellStat value={5} label="chương — một hành trình cuộn" light />
      </ChapterShell>
    </div>
  );
}

/** Shell + nav — cuộn: crossfade 6 mood + scroll-spy 5 mục (aria-current). */
export const ShellAndNav: Story = {
  name: 'Shell + SideNav — scroll-spy 5 chương + mood crossfade',
  render: () => <ShellNavPage />,
};
