// useToggle — boolean + hàm đảo, pattern usehooks.com/ui.dev.
// toggle() không đối số → đảo; toggle(true|false) → đặt giá trị; nhận cả updater.
import { useCallback, useState } from 'react';

export function useToggle(initialValue = false) {
  const [on, setOn] = useState(initialValue);

  const toggle = useCallback((next?: boolean | ((prev: boolean) => boolean)) => {
    setOn((prev) => {
      if (next === undefined) return !prev;
      return typeof next === 'function' ? next(prev) : next;
    });
  }, []);

  return [on, toggle] as const;
}
