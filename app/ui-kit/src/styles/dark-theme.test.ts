// Regression F1 (2026-10-18): data-bp-theme="dark" đặt trên <html> phải thắng tie
// specificity với `:root` (tokens.css đứng sau @import dark.css → cùng 0,1,0, light
// thắng theo source order) → dark.css cần nhánh `html[data-bp-theme='dark']`
// (0,1,1). Đồng thời nhánh generic `[data-bp-theme='dark']` (wrapper node/body —
// docs rule 2 "node bao", kit stories dùng div wrapper) KHÔNG được mất.
// jsdom không áp CSS file → test assert source selector, không assert computed style.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// vitest chạy với cwd = package root; jsdom env đổi scheme import.meta.url nên dùng path tương đối
const css = readFileSync('src/styles/themes/dark.css', 'utf8');

describe('dark.css — html path specificity (F1 regression)', () => {
  it('có nhánh html[data-bp-theme] (0,1,1) thắng :root tie — html path hoạt động', () => {
    expect(css).toContain("html[data-bp-theme='dark']");
  });

  it('giữ nhánh generic [data-bp-theme] cho wrapper node/body (docs rule 2 "node bao")', () => {
    expect(css).toMatch(/^\[data-bp-theme='dark'\]/m);
  });
});
