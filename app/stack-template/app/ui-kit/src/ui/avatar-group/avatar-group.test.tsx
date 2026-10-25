// AvatarGroup tests — render đủ/max gộp +N/tooltip tên/fallback ưu tiên/overlap.
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AvatarGroup } from './index.js';

const TEAM = [
  { name: 'An Nguyen' },
  { name: 'Binh Tran', src: 'https://example.com/binh.png' },
  { name: 'Chi Le', fallback: 'CX' },
  { name: 'Duong Pham' },
  { name: 'Giang Vo' },
];

afterEach(cleanup);

describe('AvatarGroup', () => {
  it('không max → đủ 5 avatar (initials từ tên)', () => {
    render(<AvatarGroup items={TEAM} />);
    expect(screen.getByText('AN')).toBeInTheDocument();
    expect(screen.getByText('CX')).toBeInTheDocument(); // fallback ưu tiên hơn initials 'CL'
    expect(screen.getByText('DP')).toBeInTheDocument();
    expect(screen.getByText('GV')).toBeInTheDocument();
  });

  it('src → render <img> với src đó', () => {
    const { container } = render(<AvatarGroup items={[TEAM[1]!]} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://example.com/binh.png');
  });

  it('max=2 → 2 avatar đầu (text + img) + pill "+3"; tên dư không render', () => {
    const { container } = render(<AvatarGroup items={TEAM} max={2} />);
    expect(screen.getByText('AN')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeNull(); // Binh qua src
    expect(screen.queryByText('CX')).toBeNull();
    expect(screen.queryByText('DP')).toBeNull();
    expect(screen.queryByText('GV')).toBeNull();
    expect(screen.getByText('+3')).toBeInTheDocument();
  });

  it('hover avatar → tooltip tên', async () => {
    const user = userEvent.setup();
    render(<AvatarGroup items={TEAM.slice(0, 1)} />);
    await user.hover(screen.getByText('AN'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('An Nguyen');
  });

  it('hover pill +N → tooltip liệt kê tên bị ẩn', async () => {
    const user = userEvent.setup();
    render(<AvatarGroup items={TEAM} max={2} />);
    await user.hover(screen.getByText('+3'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Chi Le');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Duong Pham');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Giang Vo');
  });

  it('overlap: avatar không đầu tiên có -ml-2 (wrapper), đầu tiên không', () => {
    const { container } = render(<AvatarGroup items={TEAM.slice(0, 2)} />);
    const wrappers = container.querySelectorAll('span');
    const withOffset = Array.from(wrappers).filter((el) => el.className.includes('-ml-2'));
    expect(withOffset).toHaveLength(1); // chỉ avatar thứ 2
  });

  it('size truyền xuống avatar (style width)', () => {
    const { container } = render(<AvatarGroup items={TEAM.slice(0, 1)} size={48} />);
    const avatar = container.querySelector('span > span');
    expect(avatar).toHaveStyle({ width: '48px' });
  });
});
