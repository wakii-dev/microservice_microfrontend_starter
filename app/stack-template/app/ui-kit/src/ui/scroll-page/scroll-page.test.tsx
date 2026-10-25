// Tests ScrollPage — snap structure (container snap-y mandatory + overflow),
// Section snap-start + min-h-full, composite .Section, a11y (id/aria-label).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ScrollPage } from './index.js';

afterEach(cleanup);

describe('ScrollPage', () => {
  it('container: snap-y snap-mandatory + overflow-y-auto + h-screen; composite .Section render', () => {
    render(
      <ScrollPage aria-label="Deck">
        <ScrollPage.Section id="s1" aria-label="Intro">
          First
        </ScrollPage.Section>
        <ScrollPage.Section id="s2">Second</ScrollPage.Section>
      </ScrollPage>,
    );
    const deck = screen.getByLabelText('Deck');
    expect(deck.className).toContain('snap-y');
    expect(deck.className).toContain('snap-mandatory');
    expect(deck.className).toContain('overflow-y-auto');
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('Section: snap-start + min-h-full, passthrough id/aria-label (landmark section)', () => {
    render(
      <ScrollPage>
        <ScrollPage.Section id="hero" aria-label="Hero">
          content
        </ScrollPage.Section>
      </ScrollPage>,
    );
    const section = document.getElementById('hero')!;
    expect(section.tagName).toBe('SECTION');
    expect(section.className).toContain('snap-start');
    expect(section.className).toContain('min-h-full');
    expect(section).toHaveAttribute('aria-label', 'Hero');
  });

  it('className passthrough cả container lẫn section', () => {
    render(
      <ScrollPage className="my-deck">
        <ScrollPage.Section className="my-section">x</ScrollPage.Section>
      </ScrollPage>,
    );
    expect(document.querySelector('.my-deck')).toBeInTheDocument();
    expect(document.querySelector('.my-section')).toBeInTheDocument();
  });
});
