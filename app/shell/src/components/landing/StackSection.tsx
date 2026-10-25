// StackSection — 2 scroll section: (1) terminal giả lệnh boot + kiến trúc
// 4 tầng (FE shell/remotes → gateway → BE services → infra) stagger vào
// viewport; (2) giải thích ngắn từng tầng. whileInView once — scroll-driven.
import { motion } from 'framer-motion';
import { Icon } from '@wakii/ui-kit';

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

const sectionMotion = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

function Terminal() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-s1 shadow-[var(--shadow-pop)]" role="img" aria-label="Terminal boot sequence demo">
      <div className="flex items-center gap-1.5 border-b border-line bg-s2 px-3 py-2">
        <span aria-hidden="true" className="size-2.5 rounded-pill bg-st-fail" />
        <span aria-hidden="true" className="size-2.5 rounded-pill bg-st-doing" />
        <span aria-hidden="true" className="size-2.5 rounded-pill bg-st-done" />
        <span className="ml-2 font-mono text-meta text-ink3">boot — zsh</span>
      </div>
      <div className="flex flex-col gap-1.5 p-4 font-mono text-meta">
        {TERMINAL_LINES.map((line, i) => (
          <motion.span
            key={line.text}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.18, duration: 0.3 }}
            className={line.prompt ? 'text-ink' : 'text-st-done'}
          >
            {line.prompt ? <span className="mr-2 text-accent">$</span> : <span className="mr-2">›</span>}
            {line.text}
          </motion.span>
        ))}
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + TERMINAL_LINES.length * 0.18 }}
          aria-hidden="true"
          className="text-accent"
        >
          ▌
        </motion.span>
      </div>
    </div>
  );
}

/** Section kiến trúc: terminal trái + 4 tầng diagram phải (stagger theo tầng). */
export function StackSection() {
  return (
    <section aria-label="Architecture" className="flex flex-col gap-8 py-10">
      <motion.h2 {...sectionMotion} className="m-0 text-center text-h1 font-bold text-ink">
        One command, one gateway, four tiers
      </motion.h2>
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <motion.div {...sectionMotion}>
          <Terminal />
        </motion.div>
        <div className="flex flex-col gap-3">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.label}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="flex items-center gap-4 rounded-xl border border-line bg-s1 p-4"
            >
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon name={tier.icon} size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-label font-semibold text-ink">{tier.label}</div>
                <div className="truncate font-mono text-meta text-ink3">{tier.items.join('  ·  ')}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
