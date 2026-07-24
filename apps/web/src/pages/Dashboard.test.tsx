import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

const mockUseDashboard = vi.fn();
const mockSyncTasks = vi.fn();

vi.mock('../hooks/useDashboard', () => ({
  useDashboard: () => mockUseDashboard(),
}));

vi.mock('../hooks/useDashboardTaskActions', () => ({
  useDashboardTaskActions: (tasks: unknown[]) => ({
    tasks,
    animating: {},
    syncTasks: mockSyncTasks,
    handleComplete: vi.fn(),
    handleSkip: vi.fn(),
    handleSnooze: vi.fn(),
  }),
}));

vi.mock('../services/api', () => ({
  tasksApi: {
    applyScheduleSuggestion: vi.fn(),
  },
}));

vi.mock('../components/gardens/GardenCard', () => ({
  GardenCard: ({ garden }: { garden: { name: string } }) => <article>{garden.name}</article>,
}));

vi.mock('../components/weather/WeatherAdvicePanel', () => ({
  WeatherAdvicePanel: () => <section>Weather advice panel</section>,
}));

vi.mock('../components/buddy/BuddyDashboardPanel', () => ({
  default: () => <section>Buddy dashboard panel</section>,
}));

vi.mock('../components/buddy/SeasonalBanner', () => ({
  default: () => <section>Seasonal banner panel</section>,
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    mockUseDashboard.mockReset();
    mockSyncTasks.mockReset();
  });

  it('renders summary metrics from dashboard and garden summary data', async () => {
    mockUseDashboard.mockReturnValue({
      data: dashboardPayload(),
      loading: false,
      error: '',
      reload: vi.fn(),
    });
    renderDashboard();

    expect(await screen.findByRole('link', { name: /My Gardens: 2/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Garden score: 91/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Care areas: 1/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Gardens ready: 2/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Completed: 4/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Today care: 1 due/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Late care: 1 overdue/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Care type summary: 1 area/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show details/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    fireEvent.click(screen.getByRole('button', { name: /Show details/i }));
    expect(screen.getByRole('button', { name: /Hide details/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('region', { name: /Catch up gently/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open tasks' })).toBeInTheDocument();
    expect(screen.getByText('Priority care')).toBeInTheDocument();
    expect(screen.getByText('Kitchen herbs')).toBeInTheDocument();
    expect(screen.getByText('Porch plants')).toBeInTheDocument();
  });

  it('keeps garden-specific guidance out of the main dashboard', async () => {
    mockUseDashboard.mockReturnValue({
      data: dashboardPayload(),
      loading: false,
      error: '',
      reload: vi.fn(),
    });
    renderDashboard();

    expect(await screen.findByText('Kitchen herbs')).toBeInTheDocument();

    const gardenContext = screen.getByLabelText('Garden context');

    expect(screen.getByText('Priority care').compareDocumentPosition(gardenContext)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.queryByRole('heading', { name: 'Recommendations' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Needs attention' })).not.toBeInTheDocument();
  });

  it('surfaces dashboard load failures as an alert', async () => {
    mockUseDashboard.mockReturnValue({
      data: null,
      loading: false,
      error: 'Could not load your dashboard.',
      reload: vi.fn(),
    });
    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your dashboard.');
  });

  it('keeps prior dashboard data usable when a refresh fails and retries the dashboard', async () => {
    const reload = vi.fn();
    mockUseDashboard.mockReturnValue({
      data: dashboardPayload(),
      loading: false,
      error: 'Could not refresh your dashboard.',
      reload,
    });

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not refresh your dashboard.',
    );
    expect(screen.getByRole('region', { name: /Catch up gently/i })).toBeInTheDocument();
    expect(screen.getByText('Kitchen herbs')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry dashboard' }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });
});

function dashboardPayload() {
  return {
    greeting: {
      name: 'Maya',
      dateLabel: 'Monday, Jun 29',
      statusLine: '2 care areas ready',
    },
    metrics: {
      totalPlants: 2,
      dueToday: 1,
      overdue: 1,
      completedToday: 4,
      gardenScore: 91,
    },
    plants: [
      {
        id: 'plant-1',
        nickname: 'Mint',
        imageUrl: null,
        createdAt: '2026-06-01T12:00:00.000Z',
        location: 'Kitchen',
        species: { commonName: 'Mint', wateringFreqDays: 3, sunlight: 'Bright light' },
        tasks: [],
      },
      {
        id: 'plant-2',
        nickname: 'Fern',
        imageUrl: null,
        createdAt: '2026-06-10T12:00:00.000Z',
        location: 'Porch',
        species: { commonName: 'Fern', wateringFreqDays: 5, sunlight: 'Shade' },
        tasks: [],
      },
    ],
    sharedPlants: [],
    gardenSummaries: [
      {
        id: 'garden-1',
        name: 'Kitchen herbs',
        location: 'Indoor',
        isOwner: true,
        plantCount: 1,
        memberCount: 1,
        tasksDueToday: 1,
        overdue: 0,
        urgentAlerts: 0,
        status: 'Care due today',
      },
      {
        id: 'garden-2',
        name: 'Porch plants',
        location: 'Outdoor',
        isOwner: true,
        plantCount: 1,
        memberCount: 1,
        tasksDueToday: 0,
        overdue: 2,
        urgentAlerts: 0,
        status: 'Care waiting',
      },
    ],
    pendingTasks: [
      dashboardTask('task-overdue', 'plant-1', 'Mint', 'WATER', dateOffset(-1)),
      dashboardTask('task-today', 'plant-2', 'Fern', 'PRUNE', dateOffset(0)),
    ],
    todayTasks: [],
    careSummary: {
      status: 'overdue',
      headline: 'Catch up gently',
      body: 'Mint has one overdue care task.',
      actionLabel: 'Review overdue care',
      actionTo: '/garden/tasks/overdue',
      counts: {
        overdue: 1,
        dueToday: 1,
        completedToday: 4,
        pending: 2,
        openDiagnoses: 0,
      },
    },
    attention: [],
    attentionSummary: {
      status: 'calm',
      headline: 'No urgent plant issues',
      body: 'Everything is steady.',
      counts: { needsAttention: 0, info: 0 },
    },
    weekPreview: [],
    weekSummary: undefined,
    scheduleSuggestions: [],
    healthStory: {
      recentJournal: [],
      recentDiagnoses: [],
      recoveryPlants: [],
      openDiagnosisCount: 0,
    },
    engagement: {
      score: 91,
      completedInRange: 4,
      streak: 2,
      milestones: [],
    },
    weather: {
      hasLocation: false,
      cachedSummary: null,
    },
  };
}

function dashboardTask(
  id: string,
  plantId: string,
  plantName: string,
  taskType: string,
  dueDate: string,
) {
  return {
    id,
    taskType,
    dueDate,
    status: 'PENDING',
    completedAt: null,
    plant: {
      id: plantId,
      nickname: plantName,
      species: { commonName: plantName },
    },
  };
}

function dateOffset(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}
