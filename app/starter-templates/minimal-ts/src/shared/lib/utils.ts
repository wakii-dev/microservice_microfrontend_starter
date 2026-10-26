// utils — helper thuần (không React, không DOM): mọi file đều import được,
// tự nó chỉ được import lẫn nhau trong shared/ (luật kiến trúc — AGENTS.md).

/** Nối class names, bỏ giá trị falsy — thay chuỗi template lông nhông:
 * `cx('btn', isActive && 'btn-active', className)`. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
