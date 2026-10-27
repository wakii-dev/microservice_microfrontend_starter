// Marquee — dải tech-stack chạy ngang vô hạn (CSS keyframes marquee trong
// app.css, pause on hover; prefers-reduced-motion tắt ở media query cùng chỗ).
// Nội dung nhân đôi ×2 + translateX(-50%) = loop liền mạch không nhảy.
// Redesign shell-kit (2026-10-27): chip hiển thị là Tag kit (padding override
// qua style cho khớp look đã duyệt — classnames kit không merge conflict).
import { Tag } from '@wakii/ui-kit';

const STACK = [
  'React 19',
  'Module Federation',
  'Rspack',
  'Tailwind v4',
  'TanStack Query',
  'Fastify',
  'Spring Boot 3',
  'Go / chi',
  'PostgreSQL 16',
  'Kafka (KRaft)',
  'nginx gateway',
  'framer-motion',
];

export function Marquee() {
  return (
    <section aria-label="Tech stack" className="overflow-hidden py-6">
      <div className="marquee-track flex w-max items-center gap-8">
        {[0, 1].map((copy) => (
          <div key={copy} aria-hidden={copy === 1} className="flex items-center gap-8">
            {STACK.map((tech) => (
              <Tag
                key={`${copy}-${tech}`}
                className="whitespace-nowrap"
                style={{ paddingBlock: 6, paddingInline: 16 }}
                icon={<span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" />}
              >
                {tech}
              </Tag>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
