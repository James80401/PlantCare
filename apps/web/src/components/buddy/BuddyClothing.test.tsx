import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BuddyActor } from './BuddyItemVisuals';

function clothingSlots(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-clothing]'))
    .map((el) => el.getAttribute('data-clothing'))
    .filter((v): v is string => Boolean(v))
    .sort();
}

describe('equipped cosmetics render as anchored SVG layers', () => {
  it('renders no clothing layers when nothing is equipped', () => {
    const { container } = render(<BuddyActor speciesId="monstera" equippedItems={{}} />);
    expect(clothingSlots(container)).toEqual([]);
  });

  it('renders a layer for each equipped slot inside the character SVG', () => {
    const { container } = render(
      <BuddyActor
        speciesId="monstera"
        equippedItems={{
          hat: 'hat_straw',
          glasses: 'glasses_sun',
          top: 'top_scarf',
          heldItem: 'held_watering_can',
          bodyColor: 'color_rose_blush',
          bodyPattern: 'pattern_stripe',
        }}
      />,
    );

    // Clothing is drawn inside the character's <svg>, not as sibling divs.
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.querySelectorAll('[data-clothing]').length).toBeGreaterThanOrEqual(6);

    expect(clothingSlots(container)).toEqual([
      'bodyColor',
      'bodyPattern',
      'glasses',
      'hat',
      'heldItem',
      'top',
    ]);
  });

  it('ignores the "none" body pattern sentinel', () => {
    const { container } = render(
      <BuddyActor
        speciesId="monstera"
        equippedItems={{ bodyPattern: 'pattern_none', hat: 'hat_beanie' }}
      />,
    );
    expect(clothingSlots(container)).toEqual(['hat']);
  });
});
