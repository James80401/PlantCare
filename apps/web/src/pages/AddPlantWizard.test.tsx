import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.mocked(gardensApi.summaries).mockResolvedValue({
      data: [
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
      ],
    });
    vi.mocked(plantsApi.upload).mockResolvedValue({ data: { url: '/uploads/plant.jpg' } });
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
    vi.mocked(speciesApi.search).mockResolvedValue({ data: [] });

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
    vi.mocked(plantsApi.identify).mockResolvedValue({
      data: {
        confidence: 0.46,
        externalMatch: {
          provider: 'plantnet',
          providerMatchId: 'plantnet-1',
          commonName: 'String of Dolphins',
          scientificName: 'Curio peregrinus',
          confidence: 0.46,
          integrationStatus: 'requires_confirmation',
        },
      },
    });

    renderWizard();
    fireEvent.click(await screen.findByRole('button', { name: 'Mock Take or upload a photo' }));

    expect(await screen.findByText('Low-confidence visual match')).toBeInTheDocument();
    expect(screen.getByText('Confirm only if this looks like your plant.')).toBeInTheDocument();
    expect(screen.getByText(/provisional species record/i)).toBeInTheDocument();
    expect(screen.getByText(/approximate care guidance/i)).toBeInTheDocument();
  });

  it('makes optional details clear after selecting a searched species', async () => {
    vi.mocked(speciesApi.search).mockResolvedValue({
      data: [
        {
          id: 'species-1',
          commonName: 'Monstera',
          scientificName: 'Monstera deliciosa',
          sunlight: 'Bright indirect light',
          wateringFreqDays: 7,
        },
      ],
    });

    renderWizard();
    fireEvent.click(await screen.findByRole('button', { name: 'Search by name' }));
    fireEvent.change(screen.getByLabelText('Species name'), {
      target: { value: 'monstera' },
    });

    await waitFor(() => expect(screen.getByText('Monstera')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Monstera/i }));

    expect(screen.getByText('Only garden and species are required.')).toBeInTheDocument();
    expect(screen.getByText(/can all be added later/i)).toBeInTheDocument();
  });
});
