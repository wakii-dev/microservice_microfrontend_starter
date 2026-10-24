// useIsFirstRender — trả true ở lần render ĐẦU TIÊN, false từ render sau,
// pattern usehooks.com. Không dùng state (không gây re-render) — giá trị đổi
// giữa các lần render, đọc trong render/event handler đều nhất quán theo mốc.
import { useRef } from 'react';

/** `true` chỉ ở lần render đầu tiên của component. */
export function useIsFirstRender(): boolean {
  const isFirst = useRef(true);
  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }
  return false;
}
