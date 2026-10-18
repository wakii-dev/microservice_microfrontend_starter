import { fireEvent, render, screen } from '@testing-library/react';
import { it } from 'vitest';
import { PickList } from './index.js';
const SOURCE = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'ng' },
];
it('d4', () => {
  render(<PickList source={SOURCE} target={[]} />);
  const list = screen.getByRole('listbox', { name: 'Nguồn' });
  console.log('D1 Enter');
  fireEvent.keyDown(list, { key: 'Enter' });
  console.log('D2 ArrowDown');
  fireEvent.keyDown(list, { key: 'ArrowDown' });
  console.log('D3 Enter');
  fireEvent.keyDown(list, { key: 'Enter' });
  console.log('END');
});
