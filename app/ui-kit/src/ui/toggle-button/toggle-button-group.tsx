// ToggleButtonGroup — cluster các ToggleButton thành group chọn 1 (mặc định)
// hoặc nhiều (multiple). Group quản checked qua props `value` của từng nút:
// cloneElement tiêm checked/onChange, nút đứng lẻ (không `value`) giữ nguyên.
// A11y: role=group + aria-label; từng nút vẫn dùng aria-pressed của ToggleButton.
import classNames from 'classnames';
import { Children, Fragment, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { type ToggleButtonProps } from './index.js';

/** Slot classes cho Group — merge sau class mặc định (consumer append). */
export interface ToggleButtonGroupClassNames {
  /** Div role=group bọc các nút. */
  root?: string;
}

interface BaseGroupProps {
  /** Khoá toàn group (nút lẻ vẫn có thể tự disabled). */
  disabled?: boolean;
  /** Nhãn a11y của group (role=group). */
  ariaLabel?: string;
  className?: string;
  /** Inline style — passthrough lên div group. */
  style?: CSSProperties;
  /** Slot classes kiểu antd v5 (slots-wave) — merge sau class mặc định. */
  classNames?: ToggleButtonGroupClassNames;
  /** Các `ToggleButton` con — mỗi nút cần `value` để group quản trạng thái. */
  children: ReactNode;
}

interface SingleGroupProps extends BaseGroupProps {
  /** Bỏ `multiple` → chọn 1: value là 1 chuỗi. */
  multiple?: false;
  value?: string;
  onChange?: (value: string) => void;
}

interface MultiGroupProps extends BaseGroupProps {
  /** Chọn nhiều: value là mảng; bấm nút đang chọn → bỏ khỏi mảng. */
  multiple: true;
  value?: string[];
  onChange?: (value: string[]) => void;
}

export type ToggleButtonGroupProps = SingleGroupProps | MultiGroupProps;

export function ToggleButtonGroup(props: ToggleButtonGroupProps) {
  const { disabled, ariaLabel, className, children } = props;
  const slots = props.classNames;
  const { style } = props;
  const multiple = props.multiple === true;
  const value: string | string[] | undefined = props.value;
  const onChange = props.onChange as ((v: string | string[]) => void) | undefined;

  const pick = (v: string) => {
    if (!onChange) return;
    if (multiple) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };

  // Children.map KHÔNG xẻ fragment — child đầu có thể là chính Fragment
  // (children viết `<Group><>{...}</></Group>`), phải đi vào trong mới thấy
  // các ToggleButton. Đệ quy xử lý fragment, clone từng nút có `value`.
  const injectInto = (node: ReactNode): ReactNode => {
    if (!isValidElement(node)) return node;
    if (node.type === Fragment) {
      return <Fragment>{Children.map((node.props as { children?: ReactNode }).children, injectInto)}</Fragment>;
    }
    const btn = node as ReactElement<ToggleButtonProps>;
    const v = btn.props.value;
    // Nút không `value` (đứng lẻ trong group) — giữ nguyên checked/onChange riêng
    if (v === undefined) return node;
    const checked = multiple ? Array.isArray(value) && value.includes(v) : value === v;
    return cloneElement(btn, {
      checked,
      disabled: disabled || btn.props.disabled,
      onChange: () => pick(v),
    });
  };

  const items = Children.map(children, injectInto);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={classNames('inline-flex items-center gap-2', slots?.root, className)}
      style={style}
    >
      {items}
    </div>
  );
}
