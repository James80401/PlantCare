import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authApi, usersApi } from '../services/api';
import { unregisterPushNative } from '../lib/unregisterPushNative';

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
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
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.logout).mockReset();
    vi.mocked(authApi.register).mockReset();
    vi.mocked(usersApi.me).mockReset();
    vi.mocked(unregisterPushNative).mockReset();
  });

  it('starts anonymous without calling the user endpoint when no token exists', async () => {
    renderAuth();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
    expect(usersApi.me).not.toHaveBeenCalled();
  });

  it('stores login tokens and refreshes the current user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      data: { accessToken: 'access-1', refreshToken: 'refresh-1' },
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
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sam@example.com'));
    expect(localStorage.getItem('accessToken')).toBe('access-1');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-1');
    expect(screen.getByTestId('premium')).toHaveTextContent('premium');
  });

  it('does not store tokens when registration still requires verification', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      data: { requiresVerification: true, message: 'Check your email.' },
    } as never);

    renderAuth();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(authApi.register).toHaveBeenCalled());
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });

  it('logs out locally and best-effort revokes the refresh token', async () => {
    localStorage.setItem('accessToken', 'access-existing');
    localStorage.setItem('refreshToken', 'refresh-existing');
    vi.mocked(usersApi.me).mockResolvedValue({
      data: {
        id: 'user-1',
        email: 'sam@example.com',
        name: 'Sam',
        planTier: 'FREE',
        isAdmin: false,
      },
    } as never);
    vi.mocked(authApi.logout).mockResolvedValue({ data: {} } as never);

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('sam@example.com'));

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(authApi.logout).toHaveBeenCalledWith('refresh-existing');
    expect(unregisterPushNative).toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });
});
