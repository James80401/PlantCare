import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import DiagnosisResult from './DiagnosisResult';
import { trackEvent } from '../utils/analytics';

vi.mock('../utils/apiAssets', () => ({
  resolveApiAssetUrl: (url: string) => url,
}));

vi.mock('../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

describe('DiagnosisResult', () => {
  it('renders structured treatment plan details', () => {
    render(
      <MemoryRouter>
        <DiagnosisResult
          plantCarePath="/garden/plants/plant-1/care"
          diagnosis={{
            resultLabel: 'Yellow leaves',
            confidence: 0.82,
            source: 'openai',
            detailJson: JSON.stringify({
              summary: 'The soil is likely staying wet too long.',
              treatmentPlan: {
                version: 1,
                headline: 'Overwatering or root rot risk',
                urgency: 'urgent',
                careArchetype: {
                  id: 'tropical_foliage',
                  label: 'Tropical foliage',
                  description: 'Leafy indoor plants that prefer steady moisture.',
                },
                matchedProblems: [
                  {
                    id: 'overwatering-root-risk',
                    label: 'Overwatering or root rot risk',
                    category: 'roots',
                    overview: 'Wet roots can decline.',
                    expectedTimeline: '1-2 weeks',
                  },
                ],
                steps: [
                  {
                    key: 'step-1',
                    label: 'Check soil moisture before watering again',
                    taskType: 'CHECK_MOISTURE',
                    dueInDays: 0,
                    priority: 'high',
                    section: 'stabilize',
                  },
                ],
                expectedTimeline: 'Stabilization usually takes 1-2 weeks.',
                mistakesToAvoid: ['Do not fertilize stressed roots.'],
                beginnerSafetyNotes: ['Keep the plant away from pets while treating pests.'],
              },
            }),
            symptomsText: 'Lower leaves are yellow.',
            imageUrl: '/diagnosis/photo.jpg',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Treatment plan')).toBeInTheDocument();
    expect(screen.getByText('What this is based on')).toBeInTheDocument();
    expect(screen.getByText(/reported symptoms, submitted photo, AI analysis/)).toBeInTheDocument();
    expect(screen.getAllByText('Overwatering or root rot risk')[0]).toBeInTheDocument();
    expect(screen.getByText('Act now')).toBeInTheDocument();
    expect(screen.getByText('Check soil moisture before watering again')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText(/Stabilization usually takes 1-2 weeks/)).toBeInTheDocument();
    expect(screen.getByText('Safety notes')).toBeInTheDocument();
    expect(screen.getByText('Keep the plant away from pets while treating pests.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open this plant\'s care guide' })).toHaveAttribute(
      'href',
      '/garden/plants/plant-1/care',
    );
  });

  it('tracks treatment guide link clicks', () => {
    render(
      <MemoryRouter>
        <DiagnosisResult
          plantCarePath="/garden/plants/plant-1/care"
          diagnosis={{
            resultLabel: 'Yellow leaves',
            detailJson: JSON.stringify({
              treatmentPlan: {
                matchedProblems: [
                  {
                    id: 'overwatering-root-risk',
                    label: 'Overwatering or root rot risk',
                    category: 'roots',
                    overview: 'Wet roots can decline.',
                    expectedTimeline: '1-2 weeks',
                  },
                ],
              },
            }),
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Open this plant\'s care guide' }));
    expect(trackEvent).toHaveBeenCalledWith('guide_link_click', {
      surface: 'diagnosis_plant_care_guide',
      target: '/garden/plants/plant-1/care',
      label: "Open this plant's care guide",
      diagnosisLabel: 'Yellow leaves',
    });

    fireEvent.click(screen.getAllByRole('link', { name: 'Overwatering or root rot risk' })[0]);
    expect(trackEvent).toHaveBeenCalledWith('guide_link_click', {
      surface: 'diagnosis_matched_problem',
      target: '/plant-problems/root-rot',
      label: 'Overwatering or root rot risk',
      problemId: 'overwatering-root-risk',
      diagnosisLabel: 'Yellow leaves',
    });
  });
});
