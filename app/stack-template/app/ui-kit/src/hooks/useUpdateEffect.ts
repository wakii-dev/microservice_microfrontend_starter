// useUpdateEffect — giống useEffect nhưng BỎ QUA lần chạy đầu (mount), pattern
// usehooks.com. Dùng cho "phản ứng với sự THAY ĐỔI" (vd sync prop → API call)
// mà không muốn kích hoạt ngay lúc gắn component.
import { useEffect, useRef, type DependencyList } from 'react';

/** Chạy `effect` sau lần cập nhật đầu tiên trở đi — bỏ qua lần mount. */
export function useUpdateEffect(effect: () => void, deps: DependencyList = []): void {
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return; // mount → skip
    }
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps do caller kiểm soát
  }, deps);
}
