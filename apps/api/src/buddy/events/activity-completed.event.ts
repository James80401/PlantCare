import { ActivityType } from '@prisma/client';

export class ActivityCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly activityType: ActivityType,
    public readonly plantId: string | null,
  ) {}
}
