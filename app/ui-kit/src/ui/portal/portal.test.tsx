// Portal — default body mount, custom container, function container, null → inline.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Portal } from './index.js';

afterEach(cleanup);

describe('Portal', () => {
  it('children land DIRECTLY in document.body by default', () => {
    render(<Portal><p data-testid="p">hi</p></Portal>);
    const p = document.body.querySelector('[data-testid="p"]')!;
    expect(p).not.toBeNull();
    expect(p.parentElement).toBe(document.body); // not inside RTL's render container
  });

  it('custom container honored', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(<Portal container={host}><span data-testid="s">x</span></Portal>);
    expect(host.querySelector('[data-testid="s"]')).not.toBeNull();
  });

  it('function container evaluated', () => {
    const host = document.createElement('div');
    const fn = vi.fn(() => host);
    render(<Portal container={fn}><span>y</span></Portal>);
    expect(fn).toHaveBeenCalled();
    expect(host.textContent).toBe('y');
  });

  it('null container → inline (no portal)', () => {
    const { container } = render(
      <Portal container={null}><em data-testid="i">z</em></Portal>,
    );
    expect(container.querySelector('[data-testid="i"]')).not.toBeNull();
  });
});
