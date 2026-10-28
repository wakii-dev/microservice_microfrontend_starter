// Test demo App — 2 nhóm assert: (1) shell render đủ khung trang (header brand,
// hero, 2 link ra kit, bảng dữ liệu mẫu), (2) dark toggle ĐỔI THẬT attribute
// `data-bp-theme` trên <html> — cơ chế theming của cả app (xem src/theme.js).
// localStorage cleared mỗi test — useAppTheme persist 'app-theme' nên phải khởi
// sạch để trạng thái đầu luôn 'light' bất kể thứ tự chạy.
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App.jsx';

describe('App — demo shell', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bp-theme');
  });

  it('render shell: brand golden-repro + hero + 2 link ra kit + bảng mẫu', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('golden-repro');
    // 2 link trong card "What's inside" — cửa ra Storybook + npm của kit
    expect(screen.getByRole('link', { name: 'Storybook — live catalog of every component' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'npm — @wakii/ui-kit' })).toBeInTheDocument();
    // Bảng demo có data mẫu
    expect(screen.getByText('Scaffold project')).toBeInTheDocument();
  });

  it('dark toggle → data-bp-theme trên <html> đổi light ↔ dark', () => {
    render(<App />);

    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' });
    expect(document.documentElement).toHaveAttribute('data-bp-theme', 'light');

    fireEvent.click(toggle);
    expect(document.documentElement).toHaveAttribute('data-bp-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).toHaveAttribute('data-bp-theme', 'light');
  });
});
