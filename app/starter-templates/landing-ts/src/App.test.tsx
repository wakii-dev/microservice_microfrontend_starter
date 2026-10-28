// Test landing — render App KHÔNG crash + đúng cấu trúc trang: hero Title (chứa
// tên app sau khi scaffold thay {{appName}}), đủ section (features · numbers ·
// FAQ · closer · footer) và FAQ CollapseTransition thu/mở THẬT khi bấm.
// jsdom thiếu IntersectionObserver → Reveal rơi nhánh fallback hiện luôn;
// matchMedia được stub trong vitest.setup.ts (Parallax/useMediaQuery/CountUp).
// CollapseTransition đóng trong jsdom KHÔNG unmount (không có transitionend) —
// assert trạng thái qua aria-expanded + inline style gridTemplateRows (1fr↔0fr).
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App — landing', () => {
  it('render 1 trang: hero {{appName}} + features + FAQ (không router)', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('{{appName}}');
    expect(screen.getByRole('heading', { level: 3, name: 'Everything a landing needs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Is the motion accessible/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('render đủ section: nav 3 anchor · KPI numbers · FAQ · closer · footer', () => {
    render(<App />);

    // Nav anchor trong trang (1 trang duy nhất — không router)
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Features' })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('link', { name: 'Numbers' })).toHaveAttribute('href', '#numbers');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '#faq');

    // Section KPI — 3 Statistic (Kit components / Hooks & utils / Storybook stories)
    expect(screen.getByText('Kit components')).toBeInTheDocument();
    expect(screen.getByText('Hooks & utils')).toBeInTheDocument();
    expect(screen.getByText('Storybook stories')).toBeInTheDocument();

    // FAQ + closer + footer
    expect(screen.getByRole('heading', { level: 3, name: 'Questions, collapsed' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Ready to ship your own?' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('FAQ CollapseTransition: mở sẵn mục đầu → bấm thu (0fr) → bấm lại mở (1fr)', () => {
    render(<App />);

    const faqButton = screen.getByRole('button', { name: /Is the motion accessible/ });
    // Panel của CollapseTransition nằm NGAY SAU nút trigger (sibling) — inline
    // style gridTemplateRows phản ánh trạng thái mở '1fr' / thu '0fr'
    const panel = faqButton.nextElementSibling as HTMLElement;
    expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    expect(panel.style.gridTemplateRows).toBe('1fr');

    fireEvent.click(faqButton);
    expect(faqButton).toHaveAttribute('aria-expanded', 'false');
    expect(panel.style.gridTemplateRows).toBe('0fr');

    fireEvent.click(faqButton);
    expect(faqButton).toHaveAttribute('aria-expanded', 'true');
    expect(panel.style.gridTemplateRows).toBe('1fr');
  });
});
