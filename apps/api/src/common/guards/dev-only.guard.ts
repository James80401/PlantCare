import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';

/** Blocks routes in production unless ENABLE_DEV_ROUTES=true. */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_ROUTES !== 'true') {
      throw new ForbiddenException('This endpoint is only available in development');
    }
    return true;
  }
}
