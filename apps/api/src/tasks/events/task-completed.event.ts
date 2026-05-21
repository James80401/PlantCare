export class TaskCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly taskId: string,
    public readonly taskType: string,
    public readonly plantId: string | null,
  ) {}
}
