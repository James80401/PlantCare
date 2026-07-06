import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GardenDashboard from './GardenDashboard';
import { recommendationsApi } from '../../services/api';
import { useGardenDetail } from '../../hooks/useGardenDetail';

vi.mock('../../hooks/useGardenDetail', () => ({
  useGardenDetail: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  recommendationsApi: {
    list: vi.fn(),
  },
}));

vi.mock('../../components/recommendations/RecommendationPanel', () => ({
  RecommendationPanel: ({
    recommendations,
  }: {
    recommendations: Array<{ id: string; title: string }>;
  }) => (
    <section aria-label="recommendation details">
      {recommendations.map((recommendation) => (
        <p key={recommendation.id}>{recommendation.title}</p>
      ))}
    </section>
  ),
}));

const mockUseGardenDetail = vi.mocked(useGardenDetail);
const mockRecommendationsList = vi.mocked(recommendationsApi.list);

describe('GardenDashboard', () => {
  beforeEach(() => {
    mockUseGardenDetail.mockReset();
    mockRecommendationsList.mockReset();
  });

  it('shows attention and recommendations that apply to the current garden', async () => {
    mockUseGardenDetail.mockReturnValue({
      garden: gardenDetail(),
      loading: false,
      error: '',
      reload: vi.fn(),
    });
    mockRecommendationsList.mockResolvedValue({
      data: [
        recommendation('rec-plant', 'Check Mint heat stress', { plantId: 'plant-1' }),
        recommendation('rec-garden', 'Adjust porch shade', { gardenId: 'garden-1' }),
        recommendation('rec-other', 'Other garden rec', { gardenId: 'other-garden' }),
      ],
    } as never);

    render(
      <MemoryRouter initialEntries={['/garden/gardens/garden-1']}>
        <Routes>
          <Route path="/garden/gardens/:gardenId" element={<GardenDashboard />} />
        </Routes>
      </MemoryRouter>,
    );

    const attention = screen.getByRole('heading', { name: 'Needs attention' });
    const attentionDetails = attention.closest('details');
    expect(attentionDetails).not.toBeNull();
    expect(within(attentionDetails as HTMLElement).getAllByText('Mint').length).toBeGreaterThan(0);

    const recommendations = await screen.findByRole('heading', { name: 'Recommendations' });
    const guidance = recommendations.closest('details');
    expect(guidance).not.toBeNull();
    await waitFor(() =>
      expect(within(guidance as HTMLElement).getByText('Check Mint heat stress')).toBeInTheDocument(),
    );
    expect(within(guidance as HTMLElement).getByText('Adjust porch shade')).toBeInTheDocument();
    expect(within(guidance as HTMLElement).queryByText('Other garden rec')).not.toBeInTheDocument();
  });
});

function gardenDetail() {
  return {
    id: 'garden-1',
    name: 'Kitchen garden',
    location: 'Indoor',
    isOwner: true,
    members: [{ id: 'member-1', role: 'OWNER', user: { id: 'user-1', email: 'me@example.com' } }],
    taskSummary: { dueToday: 0, overdue: 0, upcoming: 2 },
    nextWatering: null,
    notesCount: 0,
    tasks: [],
    plants: [
      {
        id: 'plant-1',
        nickname: 'Mint',
        imageUrl: null,
        location: 'Kitchen',
        needsAttention: true,
        species: { commonName: 'Mint', scientificName: 'Mentha' },
        nextTask: null,
      },
      {
        id: 'plant-2',
        nickname: 'Basil',
        imageUrl: null,
        location: 'Kitchen',
        needsAttention: false,
        species: { commonName: 'Basil', scientificName: 'Ocimum basilicum' },
        nextTask: null,
      },
    ],
  } as never;
}

function recommendation(
  id: string,
  title: string,
  scope: { plantId?: string; gardenId?: string },
) {
  return {
    id,
    title,
    body: title,
    source: 'SYSTEM',
    sourceKey: id,
    priority: 'MEDIUM',
    status: 'ACTIVE',
    createdAt: '2026-07-06T00:00:00.000Z',
    updatedAt: '2026-07-06T00:00:00.000Z',
    plantId: scope.plantId ?? null,
    gardenId: scope.gardenId ?? null,
  };
}
