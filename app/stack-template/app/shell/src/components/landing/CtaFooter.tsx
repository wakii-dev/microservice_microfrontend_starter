// CtaFooter — CTA cuối + footer gọn: CTA lớn gradient card + footer 3 cột
// (Docs/Remotes/Stack) + copyright. whileInView once; tokens-only.
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Button, Icon } from '@wakii/ui-kit';

/** CTA cuối — mời vào tasks hoặc đọc docs. */
export function FinalCta() {
  return (
    <motion.section
      aria-label="Get started"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="mb-10 flex flex-col items-center gap-4 rounded-xl border border-line bg-s1 p-10 text-center"
    >
      <h2 className="m-0 text-h1 font-bold text-ink">Fork it, ship your product</h2>
      <p className="m-0 max-w-lg text-body text-ink2">
        Clone, boot the stack and start in the tasks board — every layer already talks to the next.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/tasks" className="no-underline">
          <Button type="primary" size="large" icon={<Icon name="arrow-right" size={14} />}>
            Open the board
          </Button>
        </Link>
        <Link to="/login" className="no-underline">
          <Button size="large" type="text">
            Sign in
          </Button>
        </Link>
      </div>
    </motion.section>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col gap-3 border-t border-line py-6 text-meta text-ink3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-ink2">
          <span aria-hidden="true" className="grid size-4 place-items-center rounded-[4px] bg-accent">
            <Icon name="menu-bars" size={10} className="text-white" />
          </span>
          Boilerplate — wakii
        </span>
        <span className="flex gap-4">
          <Link to="/tasks" className="text-ink3 no-underline hover:text-ink">
            Tasks
          </Link>
          <Link to="/activity" className="text-ink3 no-underline hover:text-ink">
            Activity
          </Link>
          <Link to="/login" className="text-ink3 no-underline hover:text-ink">
            Login
          </Link>
        </span>
      </div>
      <span>© 2026 wakii — tokens all the way down.</span>
    </footer>
  );
}

/** Footer landing (export riêng — HomePage render cuối). */
export function LandingFooter() {
  return <Footer />;
}
