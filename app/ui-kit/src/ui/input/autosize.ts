// Textarea autoSize math — pure functions so the clamp logic is testable without layout.
// antd semantics: autoSize=true grows unbounded from 2 rows; {minRows,maxRows} clamps.
export type AutoSize = boolean | { minRows?: number; maxRows?: number };

export function resolveAutoSize(autoSize: Exclude<AutoSize, false>): { minRows?: number; maxRows?: number } {
  if (autoSize === true) return { minRows: 2 };
  return autoSize;
}

export function computeAutoSizeHeight(args: {
  scrollHeight: number;
  lineHeight: number;
  paddingY: number;
  minRows?: number;
  maxRows?: number;
}): { height: number; overflowY: 'hidden' | 'auto' } {
  const lh = args.lineHeight > 0 ? args.lineHeight : 22; // jsdom returns 0
  const content = Math.max(args.scrollHeight - args.paddingY, lh);
  const naturalRows = Math.ceil(content / lh);
  let rows = naturalRows;
  if (args.minRows !== undefined) rows = Math.max(rows, args.minRows);
  if (args.maxRows !== undefined) rows = Math.min(rows, args.maxRows);
  return {
    height: rows * lh + args.paddingY,
    overflowY: args.maxRows !== undefined && naturalRows > args.maxRows ? 'auto' : 'hidden',
  };
}
