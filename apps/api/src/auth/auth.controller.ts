import { Body, Controller, Param, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { CookieAuthDto } from './dto/cookie-auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import {
  assertCookieAuthOrigin,
  clearRefreshCookie,
  readRefreshCookie,
  setRefreshCookie,
} from './refresh-cookie';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  private withRefreshCookie<T extends object>(
    response: Response,
    result: T,
  ): Omit<T, 'refreshToken'> {
    const refreshToken =
      'refreshToken' in result && typeof result.refreshToken === 'string'
        ? result.refreshToken
        : undefined;
    if (refreshToken) {
      setRefreshCookie(
        response,
        this.config,
        refreshToken,
        this.authService.refreshTokenLifetimeMs(),
      );
    }
    const { refreshToken: _removed, ...safeResult } = result as T & {
      refreshToken?: unknown;
    };
    return safeResult as Omit<T, 'refreshToken'>;
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withRefreshCookie(response, await this.authService.register(dto));
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withRefreshCookie(response, await this.authService.login(dto));
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Body() _dto: CookieAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    assertCookieAuthOrigin(request);
    const refreshToken = readRefreshCookie(request);
    const result = await this.authService.refresh(refreshToken ?? '');
    return this.withRefreshCookie(response, result);
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Body() _dto: CookieAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    assertCookieAuthOrigin(request);
    const refreshToken = readRefreshCookie(request);
    const result = await this.authService.logout(refreshToken ?? '');
    clearRefreshCookie(response, this.config);
    return result;
  }

  @Post('verify-email')
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withRefreshCookie(response, await this.authService.verifyEmail(dto.token));
  }

  @Post('verify-email/:token')
  async verifyEmailFromLink(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.withRefreshCookie(response, await this.authService.verifyEmail(token));
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resetPassword(dto.token, dto.password);
    clearRefreshCookie(response, this.config);
    return result;
  }
}
