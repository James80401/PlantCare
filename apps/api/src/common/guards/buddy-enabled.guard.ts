import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';

/** Plant Buddy is a post-release feature — hidden until ENABLE_PLANT_BUDDY=true. */
@Injectable()
export class BuddyEnabledGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.ENABLE_PLANT_BUDDY !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
