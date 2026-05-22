export class SunshineSentEvent {
  constructor(
    public readonly userId: string,
    public readonly friendBuddyId: string,
    public readonly toUserId: string,
    public readonly fromBuddyId: string,
  ) {}
}
