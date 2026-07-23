import type { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import { CookieAuthDto } from './dto/cookie-auth.dto';

describe('AuthController cookie-only refresh', () => {
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

  it('sets the cookie on login without exposing the refresh token in JSON', async () => {
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
    expect(result).toMatchObject({ accessToken: 'access' });
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('reads and rotates only the HttpOnly refresh cookie', async () => {
    const { controller, auth, response } = createController();
    const request = {
      headers: {
        cookie: 'drplant_refresh=refresh-cookie',
        origin: 'capacitor://localhost',
      },
    } as Request;

    const result = await controller.refresh(request, {}, response);

    expect(auth.refresh).toHaveBeenCalledWith('refresh-cookie');
    expect(response.cookie).toHaveBeenCalledWith(
      'drplant_refresh',
      'refresh-rotated',
      expect.any(Object),
    );
    expect(result).not.toHaveProperty('refreshToken');
  });

  it('revokes the cookie token and clears the cookie on logout', async () => {
    const { controller, auth, response } = createController();
    const request = {
      headers: { cookie: 'drplant_refresh=refresh-cookie' },
    } as Request;

    await controller.logout(request, {}, response);

    expect(auth.logout).toHaveBeenCalledWith('refresh-cookie');
    expect(response.clearCookie).toHaveBeenCalledWith(
      'drplant_refresh',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('rejects the removed legacy refreshToken request field', async () => {
    const dto = plainToInstance(CookieAuthDto, { refreshToken: 'legacy' });
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('refreshToken');
  });
});
