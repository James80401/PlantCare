import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskRow from './TaskRow';
import type { TaskItem } from '../../utils/taskGroups';

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
    onComplete: vi.fn(),
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
  it('completes a task immediately from the checkmark', () => {
    const { onComplete } = renderRow();

    fireEvent.click(screen.getByLabelText(/Mark Fertilize for Monty as done/i));

    expect(onComplete).toHaveBeenCalledWith('task-1');
  });

  it('still allows optional water feedback from the secondary action', () => {
    const { onComplete } = renderRow({ task: makeTask({ taskType: 'WATER' as TaskItem['taskType'] }) });

    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    fireEvent.click(screen.getByRole('button', { name: /Save feedback & complete/i }));

    expect(onComplete).toHaveBeenCalledWith('task-1', { reason: 'SOIL_VERY_DRY', note: undefined });
  });

  it('skips with the default reason', () => {
    const { onSkip } = renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    fireEvent.click(screen.getByRole('button', { name: /Save reason & skip/i }));

    expect(onSkip).toHaveBeenCalledWith('task-1', { reason: 'SOIL_STILL_WET', note: undefined });
  });

  it('snoozes for the chosen duration', () => {
    const { onSnooze } = renderRow();

    fireEvent.click(screen.getByRole('button', { name: 'Snooze' }));
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
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();

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
});
