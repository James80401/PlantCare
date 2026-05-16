import { CanActivate, Injectable } from '@nestjs/common';

/** Payment disabled for now — all authenticated users may access premium features. */
@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}
