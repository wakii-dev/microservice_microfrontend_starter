// Cấu hình test-runner (mop-up round 2, worker V1 2026-10-18).
//
// Flaky đã mổ xẻ: chạy full sweep với default workers (~số CPU) làm nghẽn dev
// server Vite on-demand → một số iframe load không kịp đủ module graph → helper
// `__test` của runner chưa register (`__test is not defined` / TDZ `'blue'`).
// Fix chứng minh: --maxWorkers=2 → 620/620 pass ổn định.
//
// Ràng buộc: TestRunnerConfig của test-runner 0.26 KHÔNG có maxWorkers/retry —
// maxWorkers chỉ đặt qua CLI, đã cố định trong package.json:
//   "test-storybook": "test-storybook --maxWorkers=2"
// Ai cần worker khác: `pnpm exec test-storybook --maxWorkers=<n>` (ghi đè script).
import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  // Giảm ồn log runner (chỉ hiện warn/error khi có sự cố) — sweep 620 story
  // in hàng nghìn dòng a11y-warn gây rối output CI.
  logLevel: 'warn',
};

export default config;
