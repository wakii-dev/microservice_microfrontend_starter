// CSS side-effect import (tokens/base — rspack experiments.css / vite css); defensive:
// khai báo để typecheck đứng riêng package này sạch (pattern chung 3 FE package, SF-1)
declare module '*.css';
