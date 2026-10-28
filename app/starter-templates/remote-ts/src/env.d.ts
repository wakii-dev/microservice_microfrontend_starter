// Build-time env injected by rspack DefinePlugin (see rspack.config.mjs — never hardcode URLs)
declare const __API_BASE_URL__: string;
// CSS side-effect imports (rspack experiments.css)
declare module '*.css';
