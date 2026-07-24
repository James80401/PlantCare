import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { trackEvent } from '../../utils/analytics';
import { recommendationsApi, type RecommendationItem } from '../../services/api';
import { RecommendationPanel } from './RecommendationPanel';

vi.mock('../../utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  recommendationsApi: {
    done: vi.fn().mockResolvedValue({}),
    snooze: vi.fn().mockResolvedValue({}),
    dismiss: vi.fn().mockResolvedValue({}),
    convertToTask: vi.fn().mockResolvedValue({}),
    refresh: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

describe('RecommendationPanel', () => {
  const recommendation: RecommendationItem = {
    id: 'rec-1',
    plantId: 'plant-1',
    gardenId: 'garden-1',
    source: 'PLANT_CHECK_IN',
    sourceKey: 'plant-check-in:plant-1:2026-07-02',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    title: 'Check in on Monty',
    body: 'Add a Plant Check-In so Dr. Plant can compare the latest status.',
    actionLabel: 'Plant Check-In',
    actionPath: '/garden/plants/plant-1/journal#progress-check-in',
    createdAt: '2026-07-02T12:00:00.000Z',
    updatedAt: '2026-07-02T12:00:00.000Z',
    plant: {
      id: 'plant-1',
      nickname: 'Monty',
      species: { commonName: 'Monstera' },
    },
    garden: { id: 'garden-1', name: 'Home' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks recommendation views and confirmed lifecycle actions', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <RecommendationPanel recommendations={[recommendation]} onChanged={onChanged} />
      </MemoryRouter>,
    );

    expect(trackEvent).toHaveBeenCalledWith('recommendation_view', {
      recommendationId: 'rec-1',
      source: 'PLANT_CHECK_IN',
      priority: 'MEDIUM',
      plantId: 'plant-1',
      gardenId: 'garden-1',
      hasTaskConversion: false,
      suggestedTaskType: undefined,
    });
    expect(screen.getByText('Plant Life')).toBeInTheDocument();
    expect(screen.getByText('Helpful next step')).toBeInTheDocument();
    expect(screen.getByText('Monty')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));

    await waitFor(() => {
      expect(recommendationsApi.done).toHaveBeenCalledWith('rec-1');
      expect(onChanged).toHaveBeenCalled();
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Marked done for this recommendation cycle.',
    );
    expect(trackEvent).toHaveBeenCalledWith('recommendation_done', {
      recommendationId: 'rec-1',
      source: 'PLANT_CHECK_IN',
      priority: 'MEDIUM',
      plantId: 'plant-1',
      gardenId: 'garden-1',
      hasTaskConversion: false,
      suggestedTaskType: undefined,
    });
  });

  it('requires confirmation before converting a recommendation into a task', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const taskBackedRecommendation: RecommendationItem = {
      ...recommendation,
      id: 'rec-task',
      source: 'DR_PLANT',
      sourceKey: 'dr-plant:plant-1:task',
      title: 'Follow up on leaf spots',
      body: 'A quick health check can help compare the leaves again.',
      suggestedTaskType: 'HEALTH_CHECK',
      suggestedTaskDueInDays: 2,
    };

    render(
      <MemoryRouter>
        <RecommendationPanel
          recommendations={[taskBackedRecommendation]}
          onChanged={onChanged}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create care task' }));

    expect(recommendationsApi.convertToTask).not.toHaveBeenCalled();
    expect(screen.getByText('Create this as a time-based care task?')).toBeInTheDocument();
    expect(
      screen.getByText(/Dr\. Plant will add a health check task in 2 days/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Keep it as a recommendation if it is useful but not something/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm task' }));

    await waitFor(() => {
      expect(recommendationsApi.convertToTask).toHaveBeenCalledWith('rec-task');
      expect(onChanged).toHaveBeenCalled();
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Task created and added to your care list.',
    );
    expect(trackEvent).toHaveBeenCalledWith('recommendation_task_convert', {
      recommendationId: 'rec-task',
      source: 'DR_PLANT',
      priority: 'MEDIUM',
      plantId: 'plant-1',
      gardenId: 'garden-1',
      hasTaskConversion: true,
      suggestedTaskType: 'HEALTH_CHECK',
    });
  });

  it('renders a reassuring empty state', () => {
    render(
      <MemoryRouter>
        <RecommendationPanel
          recommendations={[]}
          onChanged={vi.fn()}
          emptyText="No extra recommendations right now. Keep up with your care tasks."
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('All quiet for now')).toBeInTheDocument();
    expect(
      screen.getByText('No extra recommendations right now. Keep up with your care tasks.'),
    ).toBeInTheDocument();
  });

  it('refreshes plant guidance only after an explicit user action', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <RecommendationPanel
          recommendations={[]}
          onChanged={onChanged}
          refreshPlantId="plant-1"
        />
      </MemoryRouter>,
    );

    expect(recommendationsApi.refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh guidance' }));

    await waitFor(() => {
      expect(recommendationsApi.refresh).toHaveBeenCalledWith('plant-1');
      expect(onChanged).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Guidance refreshed from the latest plant activity.',
    );
  });

  it('explains that dismiss only closes the current recommendation cycle', async () => {
    const onChanged = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <RecommendationPanel recommendations={[recommendation]} onChanged={onChanged} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => {
      expect(recommendationsApi.dismiss).toHaveBeenCalledWith('rec-1');
      expect(onChanged).toHaveBeenCalled();
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Dismissed for this cycle. Similar guidance can still appear later if it becomes useful again.',
    );
  });
});
