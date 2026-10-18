// InputNumber stories — matrix states (feedback user qua coordinator: stories cũ
// 'chưa hợp lý' — 2 story trần, không giải thích behavior).
// Component KHÔNG có prop size / chiều cao (input cố định h-8) → KHÔNG story Sizes —
// chỉ demo những gì component có, không thêm prop mới (docs/story boundary).
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { InputNumber } from './index';

const meta = {
  title: 'Forms/InputNumber',
  component: InputNumber,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number', description: 'Cận dưới clamp' },
    max: { control: 'number', description: 'Cận trên clamp' },
    step: { control: 'number', description: 'Bước tăng/giảm (stepper + ↑↓)' },
  },
} satisfies Meta<typeof InputNumber>;
export default meta;

type S = StoryObj<typeof meta>;

interface DemoProps {
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
}

/** Demo tương tác: value={v ?? undefined} (prop chỉ đọc lúc mount — state v chỉ để
 * HIỂN THỊ giá trị onChange phát ra, không điếu khiển input). */
function Demo({
  min = 0,
  max = 100,
  step = 1,
  ariaLabel,
  hint,
  initial,
}: DemoProps & { hint?: string; initial?: number }) {
  const [v, setV] = useState<number | null>(initial ?? null);
  return (
    <div className="grid max-w-[320px] gap-3">
      <InputNumber
        ariaLabel={ariaLabel}
        min={min}
        max={max}
        step={step}
        value={v ?? undefined}
        onChange={setV}
      />
      <p className="m-0 font-mono text-meta text-ink3">
        {hint && <span className="block font-sans">{hint}</span>}
        min {min} · max {max} · step {step} → onChange:{' '}
        <strong className="text-ink">{v === null ? 'null' : v}</strong>
      </p>
    </div>
  );
}

/** Cơ bản — input số với 2 nút stepper xếp dọc trong mép phải (Tăng/Giảm). Demo
 * min=0, max=100, step=1; dòng mono dưới input hiển thị giá trị onChange theo
 * thời gian thực (gõ text không phải số hoặc xoá rỗng → null). */
export const CoBan: S = {
  args: { min: 0, max: 100, step: 1, ariaLabel: 'Số lượng' },
  render: ({ min, max, step, ariaLabel }) => (
    <Demo
      ariaLabel={ariaLabel}
      initial={5}
      hint="Gõ số hoặc bấm nút Tăng/Giảm — giá trị phát ra qua onChange:"
      max={max}
      min={min}
      step={step}
    />
  ),
};

/** Clamp min/max — gõ giá trị vượt cận (vd 99 với max 10) rồi blur: onChange nhận
 * giá trị đã clamp về 10 VÀ ô input tự nhảy về 10 (sync text lúc blur — gõ giữa
 * chừng không bị ép); xoá rỗng rồi blur → onChange(null). */
export const MinMaxClamp: S = {
  args: { min: 0, max: 10, step: 1, ariaLabel: 'Số lượng (giới hạn 0–10)' },
  render: ({ min, max, step, ariaLabel }) => (
    <Demo
      ariaLabel={ariaLabel}
      hint="Thử: gõ 99 → blur → ô input nhảy về 10, onChange = 10. Xoá rỗng → blur → onChange = null."
      max={max}
      min={min}
      step={step}
    />
  ),
};

/** Disabled — khoá cả input lẫn 2 nút stepper; cả nhóm mờ đi (nền bg-s3 +
 * opacity) báo rõ vùng không tương tác. */
export const Disabled: S = {
  args: { disabled: true, value: 5, ariaLabel: 'Số lượng (disabled)' },
};

/** Invalid — viền đỏ --st-fail trên cả input lẫn cột stepper (thay border-line
 * và mất hiệu ứng focus accent), dùng khi validation form báo lỗi. */
export const Invalid: S = {
  args: { invalid: true, value: -1, min: 0, max: 100, ariaLabel: 'Số lượng (lỗi)' },
};

/** Keyboard — focus input rồi bấm ↑ / ↓: tăng/giảm theo step (bắt ArrowUp/
 * ArrowDown, preventDefault chặn scroll trang) và vẫn clamp min/max. Nút stepper
 * phát cùng dạng onChange nên 2 đường tương tác đồng nhất. */
export const KeyboardArrow: S = {
  name: 'Keyboard ↑↓',
  args: { min: 0, max: 10, step: 2, ariaLabel: 'Số lượng (↑↓)' },
  render: ({ min, max, step, ariaLabel }) => (
    <Demo
      ariaLabel={ariaLabel}
      initial={4}
      hint={`Focus input rồi bấm ↑ / ↓ — mỗi lần ±${step}, clamp [0, 10]:`}
      max={max}
      min={min}
      step={step}
    />
  ),
};
