import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import DrPlantChat from './DrPlantChat';
import { diagnosisChatApi } from '../services/api';

vi.mock('../services/api', () => ({
  diagnosisChatApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    sendMessage: vi.fn(),
    saveJournalNote: vi.fn(),
    scheduleHealthCheck: vi.fn(),
    getRecoverySuggestions: vi.fn(),
    applyRecoveryTasks: vi.fn(),
    getActionDrafts: vi.fn(),
    confirmRecommendationDraft: vi.fn(),
    confirmTaskDraft: vi.fn(),
    getGuidedContextQuestions: vi.fn(),
  },
}));

function response(data: unknown) {
  return { data } as AxiosResponse;
}

function conversation(id: string, title: string) {
  return {
    id,
    title,
    updatedAt: '2026-07-23T12:00:00.000Z',
    _count: { messages: 0 },
    messages: [],
  };
}

describe('DrPlantChat plant boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('does not let a late response from another plant enter the current chat', async () => {
    let resolveFirst: ((value: AxiosResponse) => void) | undefined;
    vi.mocked(diagnosisChatApi.list).mockImplementation((plantId) => {
      if (plantId === 'plant-a') {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      return Promise.resolve(response([conversation('chat-b', 'Beta history')])) as never;
    });

    const { rerender } = render(
      <MemoryRouter>
        <DrPlantChat plantId="plant-a" plantName="Alpha" />
      </MemoryRouter>,
    );
    rerender(
      <MemoryRouter>
        <DrPlantChat plantId="plant-b" plantName="Beta" />
      </MemoryRouter>,
    );

    expect((await screen.findAllByText('Beta history')).length).toBeGreaterThan(0);
    resolveFirst?.(response([conversation('chat-a', 'Alpha history')]));
    await waitFor(() => expect(screen.queryByText('Alpha history')).not.toBeInTheDocument());
  });

  it('clears a plant-specific draft when the component changes plants', async () => {
    vi.mocked(diagnosisChatApi.list).mockResolvedValue(response([]) as never);
    const { rerender } = render(
      <MemoryRouter>
        <DrPlantChat plantId="plant-a" plantName="Alpha" />
      </MemoryRouter>,
    );
    const draft = screen.getByPlaceholderText('Ask Dr. Plant...');
    fireEvent.change(draft, { target: { value: 'Only about Alpha' } });
    expect(draft).toHaveValue('Only about Alpha');

    rerender(
      <MemoryRouter>
        <DrPlantChat plantId="plant-b" plantName="Beta" />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText('Ask Dr. Plant...')).toHaveValue(''),
    );
  });
});
