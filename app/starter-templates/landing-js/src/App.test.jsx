// Smoke test mẫu — render landing không crash + đúng cấu trúc trang: hero Title
// (chứa tên app sau khi scaffold thay {{appName}}), section Features, FAQ mở
// sẵn mục đầu. jsdom thiếu IntersectionObserver → Reveal rơi nhánh fallback
// hiện luôn; matchMedia được stub trong vitest.setup.js (Parallax/useMediaQuery).
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App — landing', () => {
  it('render 1 trang: hero {{appName}} + features + FAQ (không router)', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('{{appName}}');
    expect(screen.getByRole('heading', { level: 3, name: 'Everything a landing needs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Is the motion accessible/ })).toHaveAttribute('aria-expanded', 'true');
  });
});
