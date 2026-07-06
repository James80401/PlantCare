import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { trackEvent } from '../../utils/analytics';
import { CareGuideCard } from './shared';
import { sortCareSections } from './PlantCareTab';

vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('CareGuideCard', () => {
  it('tracks Ask Dr. Plant clicks from care guide sections', () => {
    render(
      <MemoryRouter>
        <CareGuideCard
          plantId="plant-1"
          drPlantPath="/garden/plants/plant-1/health#dr-plant"
          section={{
            id: 'water',
            heading: 'Water',
            whyItMatters: 'Water timing drives root health.',
            beginnerBody: 'Check the top inch before watering.',
            advancedBody: 'Adjust watering by light, temperature, and potting mix.',
            warnings: [],
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Ask Dr. Plant about Water' }));

    expect(trackEvent).toHaveBeenCalledWith('guide_dr_plant_click', {
      surface: 'plant_care_card',
      plantId: 'plant-1',
      sectionId: 'water',
      sectionHeading: 'Water',
      target: '/garden/plants/plant-1/health#dr-plant',
    });
  });
});

describe('sortCareSections', () => {
  it('orders care sections by beginner scan priority', () => {
    const sections = [
      section('toxicity', 'Safety'),
      section('propagation', 'Propagation'),
      section('water', 'Water'),
      section('pests', 'Pests'),
      section('light', 'Light'),
    ];

    expect(sortCareSections(sections).map((section) => section.id)).toEqual([
      'water',
      'light',
      'pests',
      'toxicity',
      'propagation',
    ]);
  });
});

function section(id: Parameters<typeof sortCareSections>[0][number]['id'], heading: string) {
  return {
    id,
    heading,
    whyItMatters: `${heading} matters.`,
    beginnerBody: `${heading} beginner guidance.`,
    advancedBody: `${heading} advanced guidance.`,
    warnings: [],
  };
}
