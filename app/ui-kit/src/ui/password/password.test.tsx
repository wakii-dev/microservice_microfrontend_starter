import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Password } from './index.js';
afterEach(cleanup);
describe('Password', () => {
  it('type password mặc định; toggle → text', () => {
    const { rerender } = render(<Password ariaLabel="pw" value="secret" />);
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByLabelText('Hiện mật khẩu'));
    rerender(<Password ariaLabel="pw" value="secret" />);
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'text');
  });
  it('showStrength → strength bars', () => {
    render(<Password ariaLabel="pw" value="Strong1!" showStrength />);
    expect(screen.getByText('Mạnh')).toBeInTheDocument();
  });
});

describe('Password — matrix (uncontrolled/strength/disabled/a11y)', () => {
  it('uncontrolled — gõ qua state nội bộ + onChange', () => {
    const onChange = vi.fn();
    render(<Password ariaLabel="pw" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('pw'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenLastCalledWith('abc');
  });

  it('strength label theo độ mạnh: yếu/trung bình', () => {
    const { rerender } = render(<Password ariaLabel="pw" value="Abcde" showStrength />);
    expect(screen.getByText('Yếu')).toBeInTheDocument(); // 1 điểm: có chữ hoa, <8 ký tự
    rerender(<Password ariaLabel="pw" value="Abcdefgh" showStrength />);
    expect(screen.getByText('Trung bình')).toBeInTheDocument();
    // queryByText (KHÔNG getByText) — getByText throw khi không thấy, không bao giờ null
    expect(screen.queryByText('Yếu')).toBeNull();
  });

  it('disabled → input khoá + toggle ẩn/hiện vẫn bấm được nhưng type đổi', () => {
    render(<Password ariaLabel="pw" value="secret" disabled />);
    expect(screen.getByLabelText('pw')).toBeDisabled();
  });

  it('placeholder passthrough', () => {
    render(<Password ariaLabel="pw" placeholder="Nhập mật khẩu" />);
    expect(screen.getByLabelText('pw')).toHaveAttribute('placeholder', 'Nhập mật khẩu');
  });
});

describe('Password — classNames slots + style (slots wave 3)', () => {
  it('slots lên đúng element: root / field / input / toggle / strengthMeter', () => {
    render(
      <Password
        ariaLabel="pw"
        showStrength
        value="Str0ngPass!"
        classNames={{ root: 'slot-root', field: 'slot-field', input: 'slot-input', toggle: 'slot-toggle', strengthMeter: 'slot-meter' }}
      />,
    );
    const input = screen.getByLabelText('pw');
    expect(input.closest('.relative')).toHaveClass('slot-field');
    expect(input).toHaveClass('slot-input');
    expect(input.parentElement!.parentElement).toHaveClass('slot-root');
    expect(screen.getByLabelText('Hiện mật khẩu')).toHaveClass('slot-toggle');
    expect(screen.getByText('Mạnh').parentElement).toHaveClass('slot-meter');
  });

  it('style passthrough lên root + không truyền slots → toggle vẫn đổi type (behavior giữ nguyên)', () => {
    render(<Password ariaLabel="pw" style={{ margin: '8px' }} className="user-last" />);
    const root = screen.getByLabelText('pw').parentElement!.parentElement as HTMLElement;
    expect(root).toHaveStyle({ margin: '8px' });
    expect(root.className.indexOf('user-last')).toBeGreaterThanOrEqual(0);
    fireEvent.click(screen.getByLabelText('Hiện mật khẩu'));
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'text');
  });
});
