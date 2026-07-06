import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import TaskRow from './components/tasks/TaskRow';
import DrPlantContextPanel from './components/DrPlantContextPanel';
import { HelpButton } from './components/ui/HelpButton';
import { BottomSheet } from './components/ui/BottomSheet';
import { RecommendationPanel } from './components/recommendations/RecommendationPanel';
import type { TaskItem } from './utils/taskGroups';
import { diagnosisApi, type RecommendationItem } from './services/api';

vi.mock('./services/api', () => ({
  diagnosisApi: { getContextSummary: vi.fn() },
  recommendationsApi: {
    done: vi.fn(),
    snooze: vi.fn(),
    dismiss: vi.fn(),
    convertToTask: vi.fn(),
  },
}));

vi.mock('./utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

// color-contrast needs real layout/paint, which jsdom does not provide; we audit
// structure/names/roles here and leave contrast to the manual 200%/contrast pass.
async function violations(container: HTMLElement): Promise<string[]> {
  const results = await axe(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help}`);
}

function pendingTask(): TaskItem {
  return {
    id: 'task-1',
    plant: { id: 'plant-1', nickname: 'Monty', species: { commonName: 'Monstera' } },
    taskType: 'WATER',
    dueDate: new Date().toISOString(),
    status: 'PENDING',
  } as TaskItem;
}

function recommendation(): RecommendationItem {
  return {
    id: 'rec-1',
    plantId: 'plant-1',
    gardenId: 'garden-1',
    source: 'DR_PLANT',
    sourceKey: 'dr-plant:plant-1:task',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    title: 'Follow up on leaf spots',
    body: 'A quick health check can help compare the leaves again.',
    actionLabel: 'Open health tab',
    actionPath: '/garden/plants/plant-1/health',
    suggestedTaskType: 'HEALTH_CHECK',
    suggestedTaskDueInDays: 2,
    createdAt: '2026-07-02T12:00:00.000Z',
    updatedAt: '2026-07-02T12:00:00.000Z',
    plant: {
      id: 'plant-1',
      nickname: 'Monty',
      species: { commonName: 'Monstera' },
    },
    garden: { id: 'garden-1', name: 'Home' },
  };
}

describe('accessibility (axe)', () => {
  beforeEach(() => {
    vi.mocked(diagnosisApi.getContextSummary).mockReset();
  });

  it('TaskRow (pending) has no structural a11y violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <ul>
          <TaskRow
            task={pendingTask()}
            animState={null}
            onComplete={vi.fn()}
            onSkip={vi.fn()}
            onSnooze={vi.fn()}
          />
        </ul>
      </MemoryRouter>,
    );

    expect(await violations(container)).toEqual([]);
  });

  it('DrPlantContextPanel has no structural a11y violations once loaded', async () => {
    vi.mocked(diagnosisApi.getContextSummary).mockResolvedValue({
      data: {
        intro: 'Dr. Plant tailors answers using your recent care:',
        items: [
          { category: 'care', label: 'Care baseline', detail: 'Living room · medium pot' },
          { category: 'tasks', label: '2 upcoming care tasks', detail: 'next: Water Jun 6' },
        ],
      },
    } as never);

    const { container } = render(<DrPlantContextPanel plantId="plant-1" />);
    await screen.findByText('Care baseline');

    expect(await violations(container)).toEqual([]);
  });

  it('HelpButton has no structural a11y violations, closed or open', async () => {
    const { container } = render(<HelpButton topic="dashboard" />);
    expect(await violations(container)).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: /help/i }));
    expect(await violations(container)).toEqual([]);
  });

  it('HelpButton restores focus to its trigger after close', () => {
    render(<HelpButton topic="dashboard" />);

    const trigger = screen.getByRole('button', { name: /help/i });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));

    expect(trigger).toHaveFocus();
  });

  it('BottomSheet has no structural a11y violations when open', async () => {
    const { container } = render(
      <BottomSheet open title="Review care action" onClose={vi.fn()}>
        <button type="button">Confirm</button>
      </BottomSheet>,
    );

    expect(await violations(container)).toEqual([]);
  });

  it('RecommendationPanel has no structural a11y violations with action confirmation', async () => {
    const { container } = render(
      <MemoryRouter>
        <RecommendationPanel recommendations={[recommendation()]} onChanged={vi.fn()} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create care task' }));

    expect(await violations(container)).toEqual([]);
  });
});
