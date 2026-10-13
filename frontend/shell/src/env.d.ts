// Build-time env do rspack DefinePlugin inject (xem rspack.config.mjs)
declare const __API_BASE_URL__: string;
// CSS side-effect import (fe-shared tokens/base — rspack experiments.css); defensive:
// 3 package cùng khai báo để typecheck đứng riêng từng package đều sạch (SF-1)
declare module '*.css';
