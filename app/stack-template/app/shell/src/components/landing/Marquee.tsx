// Marquee — dải tech-stack chạy ngang vô hạn (CSS keyframes marquee trong
// app.css, pause on hover; prefers-reduced-motion tắt ở media query cùng chỗ).
// Nội dung nhân đôi ×2 + translateX(-50%) = loop liền mạch không nhảy.
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
              <span
                key={`${copy}-${tech}`}
                className="flex items-center gap-2 whitespace-nowrap rounded-pill border border-line bg-s1 px-4 py-1.5 text-label text-ink2"
              >
                <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" />
                {tech}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
