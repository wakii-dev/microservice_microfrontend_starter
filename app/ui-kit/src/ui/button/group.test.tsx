// ButtonGroup — joined chrome selectors, size/type context inheritance, a11y group semantics.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './index.js';
import { ButtonGroup } from './group.js';

afterEach(cleanup);

describe('ButtonGroup', () => {
  it('role=group + aria-label', () => {
    render(<ButtonGroup ariaLabel="Actions"><Button>One</Button></ButtonGroup>);
    expect(screen.getByRole('group', { name: 'Actions' })).toBeInTheDocument();
  });

  it('joined chrome — seam + corner selectors on the group div', () => {
    const { container } = render(
      <ButtonGroup ariaLabel="x"><Button>A</Button><Button>B</Button><Button>C</Button></ButtonGroup>,
    );
    const group = container.firstElementChild as HTMLElement;
    expect(group.className).toContain('[&>button:not(:first-child)]:-ml-px');
    expect(group.className).toContain('[&>button:not(:first-child)]:rounded-l-none');
    expect(group.className).toContain('[&>button:not(:last-child)]:rounded-r-none');
    expect(group.querySelectorAll('button')).toHaveLength(3);
  });

  it('vertical — flex-col + block-axis selectors', () => {
    const { container } = render(
      <ButtonGroup ariaLabel="x" orientation="vertical"><Button>A</Button><Button>B</Button></ButtonGroup>,
    );
    const group = container.firstElementChild as HTMLElement;
    expect(group.className).toContain('flex-col');
    expect(group.className).toContain('[&>button:not(:first-child)]:-mt-px');
    expect(group.className).toContain('[&>button:not(:last-child)]:rounded-b-none');
  });

  it('size context — child without explicit size inherits group size', () => {
    const { container } = render(<ButtonGroup ariaLabel="x" size="small"><Button>A</Button></ButtonGroup>);
    expect(container.querySelector('button')!.className).toContain('h-8');
  });

  it('explicit child size wins over group', () => {
    const { container } = render(<ButtonGroup ariaLabel="x" size="small"><Button size="large">A</Button></ButtonGroup>);
    expect(container.querySelector('button')!.className).toContain('h-10');
  });

  it('type context — group primary cascades', () => {
    const { container } = render(<ButtonGroup ariaLabel="x" type="primary"><Button>A</Button></ButtonGroup>);
    expect(container.querySelector('button')!.className).toContain('bg-accent');
  });
});

describe('ButtonGroup slots (SÓNG-3)', () => {
  it('classNames.root slot + style + className merge đúng element (root div)', () => {
    const { container } = render(
      <ButtonGroup ariaLabel="x" className="gap-x" classNames={{ root: 'slot-root' }} style={{ gap: '4px' }}>
        <Button>A</Button>
      </ButtonGroup>,
    );
    const group = container.firstElementChild as HTMLElement;
    expect(group.className).toContain('slot-root');
    expect(group.className).toContain('gap-x'); // className vẫn merge sau slot
    expect(group.style.gap).toBe('4px');
  });
});
