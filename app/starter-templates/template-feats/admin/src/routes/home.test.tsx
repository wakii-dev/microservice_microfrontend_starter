// Smoke test Home (bản ADMIN — đè test của product): Home = Dashboard qua cổng
// index; mock feature để test nhanh, không fetch.
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from './home';

vi.mock('@/features/dashboard', () => ({
  DashboardContainer: () => <div>dashboard-stub</div>,
}));

describe('HomePage (admin)', () => {
  it('render tiêu đề Dashboard + container qua index feature', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Dashboard');
    expect(screen.getByText('dashboard-stub')).toBeInTheDocument();
  });
});
