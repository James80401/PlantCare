import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isAdminEmail } from '../config/registration-policy';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: { email?: string } }>();
    const email = req.user?.email;
    if (!email || !isAdminEmail(this.config, email)) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
