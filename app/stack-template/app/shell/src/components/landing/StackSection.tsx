// StackSection — 2 scroll section (redesign shell-kit 2026-10-27): (1) terminal
// giả lệnh boot (Card kit size small, role img bọc ngoài vì Card không nhận
// aria passthrough) + kiến trúc 4 tầng = Card kit, stagger vào viewport bằng
// Reveal kit; (2) giải thích ngắn từng tầng. once — scroll-driven;
// prefers-reduced-motion kit block global tự tắt.
import { Card, Icon, Reveal } from '@wakii/ui-kit';

const TERMINAL_LINES = [
  { prompt: true, text: 'pnpm install --frozen-lockfile' },
  { prompt: true, text: 'docker compose --env-file platform/.env up -d' },
  { prompt: false, text: '✔ 10 services healthy — gateway :8080' },
  { prompt: true, text: 'pnpm --filter @wakii/shell dev' },
  { prompt: false, text: '➜ local: http://localhost:3000' },
];

const TIERS: Array<{ label: string; items: string[]; icon: 'menu-bars' | 'filter' | 'settings' | 'folder' }> = [
  { label: 'Experience', items: ['shell (MF host)', 'remote tasks', 'remote activity'], icon: 'menu-bars' },
  { label: 'Edge', items: ['nginx gateway :8080', '/ → shell · /api/* → services'], icon: 'filter' },
  { label: 'Services', items: ['node-svc :3001', 'spring-svc :8081', 'go-svc :8082'], icon: 'settings' },
  { label: 'Infra', items: ['postgres :5432', 'kafka (KRaft)', 'auth-svc :8090'], icon: 'folder' },
];

function Terminal() {
  return (
    // role=img bọc Card (Card kit không forward role/aria — xem report)
    <div role="img" aria-label="Terminal boot sequence demo">
      <Card
        size="small"
        title={
          <div className="flex items-center gap-1.5 font-mono text-meta font-normal text-ink3">
            <span aria-hidden="true" className="size-2.5 rounded-pill bg-st-fail" />
            <span aria-hidden="true" className="size-2.5 rounded-pill bg-st-doing" />
            <span aria-hidden="true" className="size-2.5 rounded-pill bg-st-done" />
            <span className="ml-2">boot — zsh</span>
          </div>
        }
      >
        <div className="flex flex-col gap-1.5 font-mono text-meta">
          {TERMINAL_LINES.map((line, i) => (
            <Reveal key={line.text} direction="left" delay={200 + i * 180}>
              <span className={line.prompt ? 'text-ink' : 'text-st-done'}>
                {line.prompt ? <span className="mr-2 text-accent">$</span> : <span className="mr-2">›</span>}
                {line.text}
              </span>
            </Reveal>
          ))}
          <Reveal direction="left" delay={200 + TERMINAL_LINES.length * 180}>
            <span aria-hidden="true" className="text-accent">
              ▌
            </span>
          </Reveal>
        </div>
      </Card>
    </div>
  );
}

/** Section kiến trúc: terminal trái + 4 tầng diagram phải (stagger theo tầng). */
export function StackSection() {
  return (
    <section aria-label="Architecture" className="flex flex-col gap-8 py-10">
      <Reveal direction="up" rootMargin="0px 0px -80px 0px">
        <h2 className="m-0 text-center text-h1 font-bold text-ink">One command, one gateway, four tiers</h2>
      </Reveal>
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <Reveal direction="up" rootMargin="0px 0px -80px 0px">
          <Terminal />
        </Reveal>
        <div className="flex flex-col gap-3">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.label} direction="right" rootMargin="0px 0px -60px 0px" delay={i * 100}>
              <Card size="small">
                <div className="flex items-center gap-4">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                    <Icon name={tier.icon} size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-label font-semibold text-ink">{tier.label}</div>
                    <div className="truncate font-mono text-meta text-ink3">{tier.items.join('  ·  ')}</div>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
