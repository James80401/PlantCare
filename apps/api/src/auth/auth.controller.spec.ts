import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';

describe('AuthController refresh-cookie compatibility', () => {
  function createController() {
    const auth = {
      login: jest.fn().mockResolvedValue({
        user: { id: 'user-1' },
        accessToken: 'access',
        refreshToken: 'refresh-new',
      }),
      refresh: jest.fn().mockResolvedValue({
        accessToken: 'access-2',
        refreshToken: 'refresh-rotated',
      }),
      logout: jest.fn().mockResolvedValue({ message: 'Logged out.' }),
      refreshTokenLifetimeMs: jest.fn().mockReturnValue(86_400_000),
    } as unknown as jest.Mocked<AuthService>;
    const config = {
      get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'production' : undefined)),
    } as unknown as ConfigService;
    const response = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as unknown as Response;
    return {
      controller: new AuthController(auth, config),
      auth,
      response,
    };
  }

  it('sets a refresh cookie on login while retaining the compatibility response', async () => {
    const { controller, response } = createController();

    const result = await controller.login(
      { email: 'user@example.com', password: 'password123' },
      response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'drplant_refresh',
      'refresh-new',
      expect.objectContaining({ httpOnly: true, secure: true }),
    );
    expect(result).toMatchObject({
      accessToken: 'access',
      refreshToken: 'refresh-new',
    });
  });

  it('prefers the cookie over the legacy refresh body and rotates it', async () => {
    const { controller, auth, response } = createController();
    const request = {
      headers: {
        cookie: 'drplant_refresh=refresh-cookie',
        origin: 'capacitor://localhost',
      },
    } as Request;

    await controller.refresh(request, { refreshToken: 'refresh-body' }, response);

    expect(auth.refresh).toHaveBeenCalledWith('refresh-cookie');
    expect(response.cookie).toHaveBeenCalledWith(
      'drplant_refresh',
      'refresh-rotated',
      expect.any(Object),
    );
  });

  it('accepts a legacy body when no cookie exists and clears cookies on logout', async () => {
    const { controller, auth, response } = createController();
    const request = { headers: {} } as Request;

    await controller.logout(request, { refreshToken: 'legacy-token' }, response);

    expect(auth.logout).toHaveBeenCalledWith('legacy-token');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'drplant_refresh',
      expect.objectContaining({ httpOnly: true }),
    );
  });
});
