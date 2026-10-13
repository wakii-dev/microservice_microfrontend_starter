// SPIKE R2 (SF-1, story VU-53) — stub JSX TẠM để chứng minh fe-shared JSX + hooks
// qua MF boundary không duplicate react (jsx-runtime singleton ×3 config).
// Render tạm trong tasks remote (exposed module) — GỐC Ngay sau khi spike PASS,
// trước khi primitives thật vào chỗ (pack slice mục 6).
import { useState } from 'react';

export function JsxProbe() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((v) => v + 1)}>
      [spike-R2] JSX probe — hooks OK ({count})
    </button>
  );
}
