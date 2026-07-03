import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import TaskRow from './components/tasks/TaskRow';
import DrPlantContextPanel from './components/DrPlantContextPanel';
import { HelpButton } from './components/ui/HelpButton';
import type { TaskItem } from './utils/taskGroups';
import { diagnosisApi } from './services/api';

vi.mock('./services/api', () => ({
  diagnosisApi: { getContextSummary: vi.fn() },
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
});
