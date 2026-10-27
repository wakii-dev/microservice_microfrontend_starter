// CtaFooter — CTA cuối + footer gọn (redesign shell-kit 2026-10-27): CTA là
// Card kit + Reveal; footer là Layout.Footer kit (role=contentinfo sẵn) với
// khối nội dung w-full tự bố cục (footer kit mặc định căn giữa — override bằng
// div con, không đụng conflict utilities). whileInView once; tokens-only.
import { Link } from 'react-router';
import { Button, Card, Icon, Layout, Reveal } from '@wakii/ui-kit';

/** CTA cuối — mời vào tasks hoặc đọc docs. */
export function FinalCta() {
  return (
    <section aria-label="Get started" className="mb-10">
      <Reveal direction="up" rootMargin="0px 0px -60px 0px">
        <Card>
          <div className="flex flex-col items-center gap-4 text-center">
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
          </div>
        </Card>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <Layout.Footer className="w-full">
      <div className="flex w-full flex-col gap-3 text-left">
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
      </div>
    </Layout.Footer>
  );
}

/** Footer landing (export riêng — HomePage render cuối). */
export function LandingFooter() {
  return <Footer />;
}
