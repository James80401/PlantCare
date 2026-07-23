import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from './Settings';
import { usersApi } from '../services/api';

const logout = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    logout,
    refreshUser: vi.fn(),
    isPremium: false,
  }),
}));

vi.mock('../context/BuddyCompanionContext', () => ({
  useBuddyCompanion: () => ({
    buddy: null,
    missing: true,
    loading: false,
    updateBuddy: vi.fn(),
  }),
}));

vi.mock('../components/ui/HelpButton', () => ({
  HelpButton: () => null,
}));

vi.mock('../components/ui/LightMeterButton', () => ({
  LightMeterButton: () => null,
}));

vi.mock('../services/api', () => ({
  usersApi: {
    me: vi.fn(),
    deleteAccount: vi.fn(),
    exportData: vi.fn(),
    updateCarePreferences: vi.fn(),
    updateSettings: vi.fn(),
    searchWeatherLocations: vi.fn(),
  },
}));

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/garden/settings']}>
      <Routes>
        <Route path="/garden/settings" element={<Settings />} />
        <Route path="/login" element={<p>Signed out</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Settings account deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.mocked(usersApi.me).mockResolvedValue({
      data: {
        notifyPush: true,
        notifyEmail: true,
        notifySms: false,
        phone: null,
        timezone: 'America/Los_Angeles',
        locationLabel: null,
        latitude: null,
        longitude: null,
        quietHoursStart: null,
        quietHoursEnd: null,
        reminderHour: 9,
        temperatureUnit: 'F',
        experienceLevel: 'beginner',
        defaultLightLevel: 'medium',
      },
    } as never);
    vi.mocked(usersApi.deleteAccount).mockResolvedValue({
      data: { deleted: true },
    } as never);
  });

  it('requires the current password and sends it to the deletion endpoint', async () => {
    renderSettings();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Delete account and plant data',
      }),
    );
    const password = screen.getByLabelText('Current password');
    expect(password).toHaveAttribute('type', 'password');
    fireEvent.change(password, { target: { value: 'correct-password' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete permanently' }),
    );

    await waitFor(() =>
      expect(usersApi.deleteAccount).toHaveBeenCalledWith('correct-password'),
    );
    expect(logout).toHaveBeenCalled();
    expect(await screen.findByText('Signed out')).toBeInTheDocument();
  });
});
