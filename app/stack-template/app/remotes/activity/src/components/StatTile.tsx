// StatTile — Card + Statistic + CountUp từ ui-kit (redesign compose-từ-kit
// 2026-10-27): đếm số animate là **CountUp của kit** (thay AnimatedValue
// motion/react tự viết — kit rAF ease-out có pulse khi giá trị đổi). Wrapper
// div giữ aria-label NGUYÊN VĂN (tests getByLabelText + toHaveTextContent đọc
// textContent subtree — CountUp animate 0.5s nên test chờ textContent đích).
import { Card, CountUp, Statistic } from '@wakii/ui-kit';

export interface StatTileProps {
  /** aria-label NGUYÊN VĂN — contract a11y có test (context pack: KHÔNG đổi) */
  ariaLabel: string;
  label: string;
  value: number;
}

export function StatTile({ ariaLabel, label, value }: StatTileProps) {
  return (
    <div aria-label={ariaLabel} className="min-w-[140px] flex-1">
      <Card size="small" className="h-full transition-colors duration-150 hover:border-line2">
        {/* duration 0.5s — jsdom rAF chạy real-time, test waitFor textContent đích */}
        <Statistic title={label} value={<CountUp value={value} duration={0.5} />} />
      </Card>
    </div>
  );
}
