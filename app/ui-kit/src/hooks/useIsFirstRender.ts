// useIsFirstRender — true trong lần render ĐẦU TIÊN, false từ render sau.
// Dùng trong RENDER (không phải effect): rẽ nhánh render theo "lần đầu".
import { useRef } from 'react';

export function useIsFirstRender(): boolean {
  const first = useRef(true);
  if (first.current) {
    first.current = false;
    return true;
  }
  return false;
}
