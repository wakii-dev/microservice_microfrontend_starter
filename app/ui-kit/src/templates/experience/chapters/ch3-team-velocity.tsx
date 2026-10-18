// CHƯƠNG 03 · TEAM VELOCITY — OWNED BY @w8 (R6: chỉ đụng file này)
// CONTRACT (EXPERIENCE-DESIGN.md v0.1): export default Ch3TeamVelocity ·
// SectionMood id="ch3" mood="velocity" (min-h-screen) · KHÔNG tự đặt nền đặc
// (cascade từ index — mood velocity → accent/10) · motion chỉ Parallax/Reveal/
// CountUp · CTA là button thật · tokens-only.
// Nội dung: mood accent (UiKitProvider theme object — accent LIVE theo tâm trạng
// chọn) + 3 workflow cards CHỌN ĐƯỢC (Tag.Checkable) + panel mô tả đổi theo lựa
// chọn (key replay slide-up-in — keyframe kit, không scroll engine riêng).
import { useState } from 'react';
import { CountUp } from '../../../ui/count-up/index';
import { Icon, type IconName } from '../../../ui/icons/index.js';
import { Reveal } from '../../../ui/reveal/index';
import { Tag } from '../../../ui/tag/index';
import { SectionMood } from '../lib/scroll-mood.js';
import { UiKitProvider } from '../../../provider/index';

/** Mood → accent: chip chọn tâm trạng, accent cascade LIVE (theme object). */
const MOODS = [
  { id: 'focus', label: 'Focus', accent: '#5e6ad2', accentHi: '#828fff' },
  { id: 'calm', label: 'Calm', accent: '#0d9488', accentHi: '#14b8a6' },
  { id: 'sprint', label: 'Sprint', accent: '#ea580c', accentHi: '#fb923c' },
] as const;

/** 3 workflow — chip Checkable chọn, panel + KPI đổi theo lựa chọn. */
const WORKFLOWS: Array<{ id: string; icon: IconName; name: string; stat: number; statLabel: string; body: string }> = [
  {
    id: 'scrum',
    icon: 'check-circle',
    name: 'Scrum',
    stat: 94,
    statLabel: 'đúng cam kết sprint',
    body: 'Sprint board WIP-limit từng cột — task chạy Backlog → Doing → Review → Done; saga gán người thực hiện tự động qua outbox event.',
  },
  {
    id: 'kanban',
    icon: 'menu-bars',
    name: 'Kanban',
    stat: 312,
    statLabel: 'thẻ flow tuần trước',
    body: 'Pull-based: kéo thẻ khi có năng lực, không sprint boundary. Keyboard đi đầy đủ — Space nhặt, arrows di, Enter thả.',
  },
  {
    id: 'shapeup',
    icon: 'pencil',
    name: 'Shape Up',
    stat: 6,
    statLabel: 'tuần một cycle',
    body: 'Shaped work vào cycle 6 tuần, cooldown 2 tuần — appetite thay vì estimate; board đọc trạng thái trực tiếp từ feed activity.',
  },
];

export default function Ch3TeamVelocity() {
  const [mood, setMood] = useState<(typeof MOODS)[number]>(MOODS[0]);
  const [workflow, setWorkflow] = useState(WORKFLOWS[0].id);
  const active = WORKFLOWS.find((w) => w.id === workflow)!;

  return (
    <SectionMood id="ch3" mood="velocity" className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-24">
        <Reveal>
          <p className="m-0 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[2.64px] text-ink2">
            <Icon name="users" size={12} />
            Chapter 03 — Team Velocity
          </p>
        </Reveal>

        <Reveal direction="up" delay={80}>
          <h2 className="m-0 mt-4 text-[29px] font-light leading-snug tracking-[0.02em] text-ink">
            Mỗi team một nhịp — <span className="text-accent">đúng mood, đúng workflow</span>
          </h2>
        </Reveal>

        {/* Mood accent — chip button thật; accent cascade LIVE qua theme object */}
        <Reveal delay={160}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="text-meta text-ink3">Mood accent:</span>
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mood.id === m.id}
                onClick={() => setMood(m)}
                className={`flex cursor-pointer items-center gap-2 rounded-pill border px-3 py-1 text-[12px] font-bold uppercase tracking-[2.4px] transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none ${
                  mood.id === m.id ? 'border-accent bg-accent/10 text-ink' : 'border-line text-ink3 hover:text-ink2'
                }`}
              >
                <span aria-hidden="true" className="size-2.5 rounded-pill" style={{ background: m.accent }} />
                {m.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Accent scope — chỉ vành demo này (theme object, không hex-class) */}
        <UiKitProvider theme={{ accent: mood.accent, accentHi: mood.accentHi }}>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {WORKFLOWS.map((w, i) => {
              const picked = w.id === workflow;
              return (
                <Reveal key={w.id} direction="up" delay={200 + i * 120} className="h-full">
                  <div
                    className={`flex h-full flex-col gap-3 rounded-xl border bg-s1 p-5 transition-colors duration-200 ${
                      picked ? 'border-accent' : 'border-line hover:border-line2'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Tag.Checkable
                        checked={picked}
                        onChange={(next) => next && setWorkflow(w.id)}
                        icon={<Icon name={w.icon} size={12} />}
                      >
                        {w.name}
                      </Tag.Checkable>
                      <span
                        aria-hidden="true"
                        className={`size-1.5 rounded-full bg-accent ${
                          picked ? 'animate-[bp-pulse-soft_2s_ease-in-out_infinite]' : 'opacity-30'
                        }`}
                      />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold tabular-nums text-ink">
                        <CountUp key={`${w.id}-${mood.id}`} value={w.stat} />
                      </span>
                      <span className="text-meta text-ink3">{w.statLabel}</span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* Panel mô tả — key={id} replay slide-up-in (keyframe kit) */}
          <div
            key={active.id}
            className="mt-6 rounded-xl border border-line bg-s1 p-5 animate-[bp-slide-up-in_var(--motion-base)_var(--ease-enter)]"
          >
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[2.4px] text-accent">
              <Icon name={active.icon} size={12} />
              {active.name} workflow
            </div>
            <p className="m-0 mt-2 max-w-3xl text-body leading-relaxed text-ink2">{active.body}</p>
          </div>
        </UiKitProvider>
      </div>
    </SectionMood>
  );
}
