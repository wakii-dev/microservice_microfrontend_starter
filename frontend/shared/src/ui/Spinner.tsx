// Spinner — vòng 14px viền 2px quay; per-item busy (hand-off §3, SF-1).
// label = aria-label BẮT BUỘC (màn đọc cần biết busy của cái gì).
export interface SpinnerProps {
  label: string;
}

export function Spinner({ label }: SpinnerProps) {
  return <span className="bp-spinner" role="status" aria-label={label} />;
}
