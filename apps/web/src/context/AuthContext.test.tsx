import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi, usersApi } from '../services/api';
import { getAccessToken, setAccessToken } from '../services/authSession';
import { unregisterPushNative } from '../lib/unregisterPushNative';

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    register: vi.fn(),
  },
  usersApi: {
    me: vi.fn(),
  },
}));

vi.mock('../lib/unregisterPushNative', () => ({
  unregisterPushNative: vi.fn(),
}));

function AuthProbe() {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="loading">{auth.loading ? 'loading' : 'ready'}</p>
      <p data-testid="user">{auth.user?.email ?? 'anonymous'}</p>
      <p data-testid="premium">{auth.isPremium ? 'premium' : 'free'}</p>
      <button type="button" onClick={() => void auth.login('sam@example.com', 'secret')}>
        Login
      </button>
      <button type="button" onClick={() => void auth.register('new@example.com', 'secret', 'New')}>
        Register
      </button>
      <button type="button" onClick={auth.logout}>
        Logout
      </button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.logout).mockReset();
    vi.mocked(authApi.refresh).mockReset().mockRejectedValue(new Error('no cookie'));
    vi.mocked(authApi.register).mockReset();
    vi.mocked(usersApi.me).mockReset();
    vi.mocked(unregisterPushNative).mockReset();
  });

  it('starts anonymous after cookie restoration reports no session', async () => {
    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(authApi.refresh).toHaveBeenCalledTimes(1);
    expect(usersApi.me).not.toHaveBeenCalled();
  });

  it('restores a page reload from the HttpOnly cookie response', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'restored-access',
      user: {
        id: 'user-1',
        email: 'sam@example.com',
        name: 'Sam',
        planTier: 'PREMIUM',
      },
    });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sam@example.com'));
    expect(getAccessToken()).toBe('restored-access');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(screen.getByTestId('premium')).toHaveTextContent('premium');
  });

  it('keeps a login access token in memory and refreshes the current user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: { accessToken: 'access-1' },
    } as never);
    vi.mocked(usersApi.me).mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'sam@example.com',
        name: 'Sam',
        planTier: 'PREMIUM',
        isAdmin: false,
      },
    } as never);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sam@example.com'));
    expect(getAccessToken()).toBe('access-1');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('does not establish a session while registration requires verification', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      data: { requiresVerification: true, message: 'Check your email.' },
    } as never);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(authApi.register).toHaveBeenCalled());
    expect(getAccessToken()).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });

  it('logs out locally and best-effort revokes the cookie session', async () => {
    vi.mocked(authApi.refresh).mockResolvedValue({
      accessToken: 'access-existing',
      user: {
        id: 'user-1',
        email: 'sam@example.com',
        name: 'Sam',
        planTier: 'FREE',
      },
    });
    vi.mocked(authApi.logout).mockResolvedValue({ data: {} } as never);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sam@example.com'));
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(authApi.logout).toHaveBeenCalledWith();
    expect(unregisterPushNative).toHaveBeenCalled();
    expect(getAccessToken()).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });
});
