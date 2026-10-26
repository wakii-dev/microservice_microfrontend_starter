// Typography — antd composite: Typography.Title (level 1–5: 38/30/24/20/16 semibold,
// margin-bottom .5em) · Text (secondary/success/warning/danger, strong/code/underline/
// delete/keyboard, copyable-lite) · Paragraph. Metrics từ antd typography default.
// slots-wave: mỗi sub-comp nhận classNames {root} (Text thêm {wrapper}) + style.
import classNames from 'classnames';
import { useCallback, useRef, type CSSProperties, type ReactNode } from 'react';

const TITLE_SIZE: Record<number, number> = { 1: 38, 2: 30, 3: 24, 4: 20, 5: 16 };
const TITLE_TAG: Record<number, 'h1' | 'h2' | 'h3' | 'h4' | 'h5'> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5' };

/** Slot classes cho Typography.Title (slots-wave). */
export interface TitleClassNames {
  /** Heading gốc (h1–h5). */
  root?: string;
}

export interface TitleProps {
  level?: 1 | 2 | 3 | 4 | 5;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: TitleClassNames;
}

export function Title(props: TitleProps) {
  const { level = 1, children, className, style } = props;
  const slots = props.classNames;
  const Tag = TITLE_TAG[level];
  return (
    <Tag
      className={classNames(slots?.root, className)}
      style={{ fontSize: TITLE_SIZE[level], fontWeight: level === 1 ? 700 : 600, lineHeight: 1.25, marginBottom: '0.5em', color: 'var(--ink)', ...style }}
    >
      {children}
    </Tag>
  );
}

export type TextType = 'secondary' | 'success' | 'warning' | 'danger';

const TYPE_COLOR: Record<TextType, string> = {
  secondary: 'var(--ink2)',
  success: 'var(--st-done)',
  warning: 'var(--st-doing)',
  danger: 'var(--st-fail)',
};

/** Slot classes cho Typography.Text (slots-wave). */
export interface TextClassNames {
  /** Outer span bọc text + icon copy. */
  wrapper?: string;
  /** Span chữ (nơi className prop cũng dính). */
  root?: string;
}

export interface TextProps {
  children: ReactNode;
  type?: TextType;
  strong?: boolean;
  code?: boolean;
  underline?: boolean;
  delete?: boolean;
  keyboard?: boolean;
  /** Copy vào clipboard khi click + tooltip title "Copy" (antd copyable-lite). */
  copyable?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: TextClassNames;
}

export function Text(props: TextProps) {
  const {
    children,
    type,
    strong,
    code,
    underline,
    delete: del,
    keyboard,
    copyable,
    className,
    style,
  } = props;
  const slots = props.classNames;
  const typeStyle = type ? { color: TYPE_COLOR[type] } : undefined;
  let content: ReactNode = children;
  if (code) content = <code style={{ fontFamily: 'var(--m)', fontSize: '0.9em', background: 'var(--s3)', padding: '0.2em 0.4em', borderRadius: 4 }}>{content}</code>;
  if (keyboard) content = <kbd style={{ fontFamily: 'var(--m)', fontSize: '0.9em', border: '1px solid var(--line)', borderBottomWidth: 2, borderRadius: 4, padding: '0 4px' }}>{content}</kbd>;
  if (underline) content = <u>{content}</u>;
  if (del) content = <del>{content}</del>;
  if (strong) content = <strong>{content}</strong>;

  const ref = useRef<HTMLSpanElement>(null);
  const onCopy = useCallback(() => {
    if (!copyable) return;
    // copy textContent — đúng nội dung user thấy (children có thể là node)
    void navigator.clipboard?.writeText(ref.current?.textContent ?? '');
  }, [copyable]);

  return (
    <span
      className={slots?.wrapper}
      style={{ cursor: copyable ? 'pointer' : undefined }}
      title={copyable ? 'Copy' : undefined}
      onClick={copyable ? onCopy : undefined}
    >
      <span
        ref={ref}
        className={classNames(slots?.root, className)}
        style={{ color: 'var(--ink)', ...typeStyle, ...style }}
      >
        {content}
      </span>
      {copyable && (
        <span aria-hidden="true" style={{ marginLeft: 4, color: 'var(--ink3)', fontSize: '0.9em' }}>
          ⧉
        </span>
      )}
    </span>
  );
}

/** Slot classes cho Typography.Paragraph (slots-wave). */
export interface ParagraphClassNames {
  /** <p> gốc. */
  root?: string;
}

export interface ParagraphProps {
  children: ReactNode;
  type?: TextType;
  strong?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Slot classes (slots-wave) — merge sau class mặc định. */
  classNames?: ParagraphClassNames;
}

export function Paragraph(props: ParagraphProps) {
  const { children, type, strong, className, style } = props;
  const slots = props.classNames;
  return (
    <p
      className={classNames(slots?.root, className)}
      style={{ margin: 0, lineHeight: 1.6, color: type ? TYPE_COLOR[type] : 'var(--ink)', fontWeight: strong ? 600 : undefined, ...style }}
    >
      {children}
    </p>
  );
}

/** Typography composite — pattern antd (Typography.Title/Text/Paragraph). */
// eslint-disable-next-line react-refresh/only-export-components
export const Typography = Object.assign(
  () => null,
  { Title, Text, Paragraph },
);
