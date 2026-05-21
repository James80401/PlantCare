export class JourneyCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly journeyId: string,
  ) {}
}
