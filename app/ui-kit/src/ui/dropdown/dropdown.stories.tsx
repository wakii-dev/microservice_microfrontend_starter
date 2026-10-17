import type { Meta, StoryObj } from "@storybook/react-vite";

type Story = StoryObj<typeof meta>;
import { useState } from 'react';
import { Dropdown } from './index';
import { Button } from '../button/index';
const meta = { title: 'Navigation/Dropdown', component: Dropdown, tags: ['autodocs'] } satisfies Meta<typeof Dropdown>;
export default meta;
type S = StoryObj<typeof meta>;
function Demo() {
  const [msg, setMsg] = useState('');
  return (
    <div>
      <Dropdown trigger={<Button>Menu ▾</Button>} onItemClick={(k) => setMsg(k)}
        items={[{ key: 'edit', label: 'Sửa' }, { key: 'del', label: 'Xoá', danger: true }]} />
      {msg && <p className="mt-2 text-label text-ink2">Chọn: {msg}</p>}
    </div>
  );
}
export const CoBan: Story = {
  args: { trigger: <button>Menu</button>, items: [{ key: 'a', label: 'A' }] },
  render: () => <Demo /> };
