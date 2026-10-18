// Entry subpath '@wakii-dev/ui-kit/chart' (batch ⑩) — import riêng component chart (chart.js)
// không qua barrel chính. Hiện chart.js không có CSS import — entry giữ chỗ ổn định
// cho consumer muốn bó phạm vi bundle; nếu sau này thêm CSS chart thì để tại ĐÂY.
export { Chart, type ChartProps, type ChartConfig, type ChartDataset } from '../ui/chart/index.js';
