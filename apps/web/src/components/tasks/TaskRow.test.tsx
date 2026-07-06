import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskRow from './TaskRow';
import type { TaskItem } from '../../utils/taskGroups';
import { journalApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  journalApi: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

function makeTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    id: 'task-1',
    plant: { id: 'plant-1', nickname: 'Monty', species: { commonName: 'Monstera' } },
    taskType: 'FERTILIZE',
    dueDate: new Date().toISOString(),
    status: 'PENDING',
    ...overrides,
  } as TaskItem;
}

function renderRow(props: Partial<React.ComponentProps<typeof TaskRow>> = {}) {
  const handlers = {
    onComplete: vi.fn().mockResolvedValue(true),
    onSkip: vi.fn(),
    onSnooze: vi.fn(),
  };
  render(
    <MemoryRouter>
      <ul>
        <TaskRow task={makeTask()} animState={null} {...handlers} {...props} />
      </ul>
    </MemoryRouter>,
  );
  return handlers;
}

describe('TaskRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes a task immediately from the checkmark', () => {
    const { onComplete } = renderRow();

    fireEvent.click(screen.getByLabelText(/Mark Fertilize for Monty as done/i));

    expect(onComplete).toHaveBeenCalledWith('task-1');
  });

  it('still allows optional water feedback from the secondary action', async () => {
    const { onComplete } = renderRow({ task: makeTask({ taskType: 'WATER' as TaskItem['taskType'] }) });

    fireEvent.click(screen.getByRole('button', { name: 'Add optional result' }));
    fireEvent.click(screen.getByRole('button', { name: /Save result & complete/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('task-1', {
        reason: 'SOIL_VERY_DRY',
        note: undefined,
      });
    });
  });

  it('can save a completion observation to the journal after completion succeeds', async () => {
    const { onComplete } = renderRow({ task: makeTask({ taskType: 'WATER' as TaskItem['taskType'] }) });

    fireEvent.click(screen.getByRole('button', { name: 'Add optional result' }));
    fireEvent.change(screen.getByPlaceholderText(/soil moisture/i), {
      target: { value: 'Soil was dry and leaves perked up after watering' },
    });
    fireEvent.click(screen.getByLabelText(/Also save this note to journal/i));
    fireEvent.click(screen.getByRole('button', { name: /Save result & complete/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('task-1', {
        reason: 'SOIL_VERY_DRY',
        note: 'Soil was dry and leaves perked up after watering',
      });
      expect(journalApi.create).toHaveBeenCalledWith('plant-1', {
        notes:
          'Water observation (Soil was very dry): Soil was dry and leaves perked up after watering',
      });
    });
  });

  it('skips with the default reason', () => {
    const { onSkip } = renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Skip if not needed' }));
    fireEvent.click(screen.getByRole('button', { name: /Record reason & skip/i }));

    expect(onSkip).toHaveBeenCalledWith('task-1', { reason: 'PLANT_LOOKS_HEALTHY', note: undefined });
  });

  it('uses general care result feedback for non-water tasks', async () => {
    const { onComplete } = renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Add optional result' }));
    expect(screen.getByText('Routine care done')).toBeInTheDocument();
    expect(screen.queryByText('Soil was very dry')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Save result & complete/i }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('task-1', {
        reason: 'ROUTINE_CARE_DONE',
        note: undefined,
      });
    });
  });

  it('snoozes for the chosen duration', () => {
    const { onSnooze } = renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Snooze' }));
    expect(screen.getByText(/only moves the reminder/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'In 1 week' }));

    expect(onSnooze).toHaveBeenCalledWith('task-1', 7);
  });

  it('links health checks to the plant progress check-in form', () => {
    renderRow({ task: makeTask({ taskType: 'HEALTH_CHECK' }) });

    expect(screen.getByRole('link', { name: 'Record progress' })).toHaveAttribute(
      'href',
      '/garden/plants/plant-1/journal?progressTask=task-1#progress-check-in',
    );
  });

  it('renders terminal states without action buttons', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ul>
          <TaskRow
            task={makeTask({ status: 'DONE', completedAt: new Date().toISOString() })}
            animState={null}
            onComplete={vi.fn()}
            onSkip={vi.fn()}
            onSnooze={vi.fn()}
          />
        </ul>
      </MemoryRouter>,
    );
    expect(screen.getByText(/Completed/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip if not needed' })).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <ul>
          <TaskRow
            task={makeTask({ status: 'SKIPPED', completedAt: new Date().toISOString() })}
            animState={null}
            onComplete={vi.fn()}
            onSkip={vi.fn()}
            onSnooze={vi.fn()}
          />
        </ul>
      </MemoryRouter>,
    );
    expect(screen.getByText('Skipped')).toBeInTheDocument();
  });

  it('flags an overdue pending task', () => {
    renderRow({ task: makeTask({ dueDate: '2020-01-01T00:00:00.000Z' }) });
    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });

  it('labels pending tasks as care tasks with optional action guidance', () => {
    renderRow();

    expect(screen.getByText('Care task')).toBeInTheDocument();
    expect(screen.getByText(/Complete when done - skip if not needed - snooze/i)).toBeInTheDocument();
    expect(screen.getByText(/Nutrient care during active growth/i)).toBeInTheDocument();
  });
});
