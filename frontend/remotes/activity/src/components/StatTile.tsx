// StatTile — card thống kê (SF-4, hand-off §4): giá trị 18px + nhãn meta 12px,
// nền --c-s2 viền --line radius --r-3 (depth = surface, không shadow).
export interface StatTileProps {
  /** aria-label NGUYÊN VĂN — contract a11y có test (context pack: KHÔNG đổi) */
  ariaLabel: string;
  label: string;
  value: number;
}

export function StatTile({ ariaLabel, label, value }: StatTileProps) {
  return (
    <div aria-label={ariaLabel} className="act-stat">
      <span className="act-stat__value">{value}</span>
      <span className="act-stat__label">{label}</span>
    </div>
  );
}
