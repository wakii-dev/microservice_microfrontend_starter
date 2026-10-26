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

// ── slots-wave: classNames slots + style passthrough ──

describe('ScrollPage — classNames + style', () => {
  it('slots lên đúng element: container + section; className sau slot', () => {
    render(
      <ScrollPage aria-label="Slotted deck" classNames={{ root: 'slot-deck' }} className="user-deck">
        <ScrollPage.Section classNames={{ root: 'slot-section' }} className="user-section">
          content
        </ScrollPage.Section>
      </ScrollPage>,
    );
    const deck = screen.getByLabelText('Slotted deck');
    expect(deck).toHaveClass('slot-deck');
    expect(deck.className.indexOf('slot-deck')).toBeLessThan(deck.className.indexOf('user-deck'));
    const section = deck.querySelector('section')!;
    expect(section).toHaveClass('slot-section');
    expect(section.className.indexOf('slot-section')).toBeLessThan(section.className.indexOf('user-section'));
  });

  it('style passthrough qua HTMLAttributes lên cả container + section', () => {
    render(
      <ScrollPage aria-label="Styled deck" style={{ margin: '8px' }}>
        <ScrollPage.Section style={{ padding: '4px' }}>x</ScrollPage.Section>
      </ScrollPage>,
    );
    const deck = screen.getByLabelText('Styled deck');
    expect(deck).toHaveStyle({ margin: '8px' });
    expect(deck.querySelector('section')).toHaveStyle({ padding: '4px' });
  });
});
