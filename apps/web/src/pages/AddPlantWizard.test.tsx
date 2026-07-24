import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosResponse } from 'axios';
import AddPlantWizard from './AddPlantWizard';
import { plantsApi, speciesApi, gardensApi } from '../services/api';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Maya', defaultLightLevel: 'medium' },
  }),
}));

vi.mock('../services/api', () => ({
  gardensApi: {
    summaries: vi.fn(),
  },
  speciesApi: {
    search: vi.fn(),
    get: vi.fn(),
  },
  plantsApi: {
    identify: vi.fn(),
    upload: vi.fn(),
    confirmExternalSpecies: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../components/plants/PhotoCaptureZone', () => ({
  PhotoCaptureZone: ({
    label,
    hint,
    onFile,
  }: {
    label: string;
    hint?: string;
    onFile: (file: File) => void;
  }) => (
    <div>
      <p>{label}</p>
      {hint ? <p>{hint}</p> : null}
      <button
        type="button"
        onClick={() => onFile(new File(['plant'], 'plant.jpg', { type: 'image/jpeg' }))}
      >
        Mock {label}
      </button>
    </div>
  ),
}));

function renderWizard() {
  return render(
    <MemoryRouter>
      <AddPlantWizard />
    </MemoryRouter>,
  );
}

function axiosResponse<T>(data: T): AxiosResponse<T> {
  return { data } as AxiosResponse<T>;
}

async function selectMonstera() {
  vi.mocked(speciesApi.search).mockResolvedValue(
    axiosResponse([
      {
        id: 'species-1',
        commonName: 'Monstera',
        scientificName: 'Monstera deliciosa',
        sunlight: 'Bright indirect light',
        wateringFreqDays: 7,
      },
    ]),
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Search by name' }));
  fireEvent.change(screen.getByLabelText('Species name'), {
    target: { value: 'monstera' },
  });
  await waitFor(() => expect(screen.getByText('Monstera')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: /Monstera/i }));
}

describe('AddPlantWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:mock-plant-photo'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.mocked(gardensApi.summaries).mockResolvedValue(
      axiosResponse([
        {
          id: 'garden-1',
          name: 'Kitchen plants',
          location: 'Indoor',
          isOwner: true,
          plantCount: 0,
          memberCount: 1,
          tasksDueToday: 0,
          overdue: 0,
          urgentAlerts: 0,
          status: 'No plants yet',
        },
      ]),
    );
    vi.mocked(plantsApi.upload).mockResolvedValue(
      axiosResponse({ url: '/uploads/plant.jpg' }),
    );
  });

  it('separates photo identification from name search on the first screen', async () => {
    renderWizard();

    expect(await screen.findByText('Identify from a photo')).toBeInTheDocument();
    expect(screen.getAllByText('Search by name').length).toBeGreaterThan(1);
    expect(
      screen.getByText(/You will review the match before anything is saved/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search by name' })).toBeInTheDocument();
  });

  it('guides manual search before and after no-result queries', async () => {
    vi.mocked(speciesApi.search).mockResolvedValue(axiosResponse([]));

    renderWizard();
    fireEvent.click(await screen.findByRole('button', { name: 'Search by name' }));

    expect(screen.getByText('Start with any common name')).toBeInTheDocument();
    expect(screen.getByText(/You do not need the scientific name/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Species name'), { target: { value: 'zz' } });

    await waitFor(() => expect(speciesApi.search).toHaveBeenCalled());
    expect(screen.getByText('No matching plants yet')).toBeInTheDocument();
    expect(screen.getByText(/Try a shorter common name/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse the full catalog' })).toBeInTheDocument();
  });

  it('frames external photo matches as provisional before confirmation', async () => {
    vi.mocked(plantsApi.identify).mockResolvedValue(
      axiosResponse({
        confidence: 0.46,
        externalMatch: {
          provider: 'plantnet',
          providerMatchId: 'plantnet-1',
          commonName: 'String of Dolphins',
          scientificName: 'Curio peregrinus',
          confidence: 0.46,
          integrationStatus: 'requires_confirmation',
        },
      }),
    );

    renderWizard();
    fireEvent.click(await screen.findByRole('button', { name: 'Mock Take or upload a photo' }));

    expect(await screen.findByText('Low-confidence visual match')).toBeInTheDocument();
    expect(screen.getByText('Confirm only if this looks like your plant.')).toBeInTheDocument();
    expect(screen.getByText(/provisional species record/i)).toBeInTheDocument();
    expect(screen.getByText(/approximate care guidance/i)).toBeInTheDocument();
  });

  it('makes optional details clear after selecting a searched species', async () => {
    renderWizard();
    await selectMonstera();

    expect(screen.getByText('Only garden and species are required.')).toBeInTheDocument();
    expect(screen.getByText(/can all be added later/i)).toBeInTheDocument();
  });

  it('retains the selected photo and offers a retry after upload failure', async () => {
    vi.mocked(plantsApi.upload)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(axiosResponse({ url: '/uploads/retried.jpg' }));

    renderWizard();
    await selectMonstera();
    fireEvent.click(screen.getByRole('button', { name: 'Mock Add a photo for your garden' }));

    const retry = await screen.findByRole('button', { name: 'Retry photo upload' });
    const firstFile = vi.mocked(plantsApi.upload).mock.calls[0][0];
    fireEvent.click(retry);

    await waitFor(() => expect(plantsApi.upload).toHaveBeenCalledTimes(2));
    expect(vi.mocked(plantsApi.upload).mock.calls[1][0]).toBe(firstFile);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Retry photo upload' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('reuses one idempotency key when saving is retried', async () => {
    vi.mocked(plantsApi.create).mockRejectedValue(new Error('network'));

    renderWizard();
    await selectMonstera();
    fireEvent.click(screen.getByRole('button', { name: 'Save plant' }));
    await waitFor(() => expect(plantsApi.create).toHaveBeenCalledTimes(1));
    fireEvent.click(await screen.findByRole('button', { name: 'Save plant' }));
    await waitFor(() => expect(plantsApi.create).toHaveBeenCalledTimes(2));

    const firstRequest = vi.mocked(plantsApi.create).mock.calls[0][0];
    const secondRequest = vi.mocked(plantsApi.create).mock.calls[1][0];
    expect(firstRequest.clientRequestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(secondRequest.clientRequestId).toBe(firstRequest.clientRequestId);
  });
});
