// StatTile — Card + Statistic từ ui-kit (app-fit migration 2026-10-18): thay raw
// div + tailwind. Statistic được thiết kế thay StatTile (comment ui-kit: "GIỮ
// ariaLabel contract — wiring ở activity") → wrapper div giữ aria-label NGUYÊN
// VĂN (tests getByLabelText + toHaveTextContent đọc textContent subtree).
// Label thành Statistic title (chuẩn antd — trên value); hover viền giữ qua
// className passthrough.
import { Card, Statistic } from '@wakii/ui-kit';

export interface StatTileProps {
  /** aria-label NGUYÊN VĂN — contract a11y có test (context pack: KHÔNG đổi) */
  ariaLabel: string;
  label: string;
  value: number;
}

export function StatTile({ ariaLabel, label, value }: StatTileProps) {
  return (
    <div aria-label={ariaLabel}>
      <Card size="small" className="h-full transition-colors duration-150 hover:border-line2">
        <Statistic title={label} value={value} />
      </Card>
    </div>
  );
}
