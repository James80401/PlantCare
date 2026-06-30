import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DiagnosisResult from './DiagnosisResult';

vi.mock('../utils/apiAssets', () => ({
  resolveApiAssetUrl: (url: string) => url,
}));

describe('DiagnosisResult', () => {
  it('renders structured treatment plan details', () => {
    render(
      <DiagnosisResult
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
            },
          }),
        }}
      />,
    );

    expect(screen.getByText('Treatment plan')).toBeInTheDocument();
    expect(screen.getAllByText('Overwatering or root rot risk')[0]).toBeInTheDocument();
    expect(screen.getByText('Act now')).toBeInTheDocument();
    expect(screen.getByText('Check soil moisture before watering again')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText(/Stabilization usually takes 1-2 weeks/)).toBeInTheDocument();
  });
});

