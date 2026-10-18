// StatTile — card thống kê (SF-4, hand-off §4): giá trị 18px + nhãn meta 12px,
// nền --c-s2 viền --line radius --r-3 (depth = surface, không shadow).
// Motion polish: hover nhẹ viền sáng hơn (transition-colors 150ms — pattern ui-kit).
export interface StatTileProps {
  /** aria-label NGUYÊN VĂN — contract a11y có test (context pack: KHÔNG đổi) */
  ariaLabel: string;
  label: string;
  value: number;
}

export function StatTile({ ariaLabel, label, value }: StatTileProps) {
  return (
    <div
      aria-label={ariaLabel}
      className="grid gap-1 rounded-3 border border-line bg-s2 p-4 transition-colors duration-150 hover:border-line2"
    >
      <span className="text-h1 font-semibold leading-[1.2] text-ink">{value}</span>
      <span className="text-meta text-ink3">{label}</span>
    </div>
  );
}
