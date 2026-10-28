// Smoke test — the exposed page (the remote's entire public surface) mounts with
// demo data and stays interactive: rows render, the filter narrows them, "Add row"
// appends one. No network — demo state is local on purpose.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { {{remoteName}}Page } from '../src/{{remoteName}}Page';

describe('{{remoteName}}Page — exposed surface', () => {
  it('renders the demo table rows with status badges', () => {
    render(<{{remoteName}}Page />);

    expect(screen.getByText('Wire the remote into the shell')).toBeInTheDocument();
    expect(screen.getByText('Replace demo data with a real API')).toBeInTheDocument();
    expect(screen.getByText('Add a gateway route')).toBeInTheDocument();
    expect(screen.getByText('done')).toBeInTheDocument();
    expect(screen.getByText('todo')).toBeInTheDocument();
  });

  it('"Add row" appends a demo row', async () => {
    render(<{{remoteName}}Page />);

    await userEvent.click(screen.getByRole('button', { name: 'Add row' }));

    expect(screen.getByText('Demo row 4')).toBeInTheDocument();
  });

  it('the filter input narrows rows', async () => {
    render(<{{remoteName}}Page />);

    await userEvent.type(screen.getByLabelText('Filter rows'), 'gateway');

    expect(screen.getByText('Add a gateway route')).toBeInTheDocument();
    expect(screen.queryByText('Wire the remote into the shell')).not.toBeInTheDocument();
  });
});
