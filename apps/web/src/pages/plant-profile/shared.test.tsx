import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { trackEvent } from '../../utils/analytics';
import { CareGuideCard } from './shared';

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

    fireEvent.click(screen.getByRole('link', { name: 'Ask Dr. Plant about this' }));

    expect(trackEvent).toHaveBeenCalledWith('guide_dr_plant_click', {
      surface: 'plant_care_card',
      plantId: 'plant-1',
      sectionId: 'water',
      sectionHeading: 'Water',
      target: '/garden/plants/plant-1/health#dr-plant',
    });
  });
});
