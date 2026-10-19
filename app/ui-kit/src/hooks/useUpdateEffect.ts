// useUpdateEffect — như useEffect nhưng BỎ QUA lần đầu (mount); từ lần sau chạy
// khi deps đổi (không truyền deps = chạy ở mọi render từ lần 2). Cleanup vẫn
// hỗ trợ. Pattern usehooks.com.
import { useEffect, useRef, type DependencyList } from 'react';

export function useUpdateEffect(effect: () => void | (() => void), deps?: DependencyList) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
