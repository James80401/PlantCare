type EventName =
  | 'UserSignedUp'
  | 'PlantAdded'
  | 'TaskCompleted'
  | 'DiagnoseSubmitted'
  | 'UpgradeToPremium'
  | 'BuddyCreated'
  | 'BuddyActivityCompleted'
  | 'BuddyShopPurchase'
  | 'BuddyJourneyStarted'
  | 'BuddyJourneyCompleted'
  | 'BuddyQuestClaimed';

export function trackEvent(name: EventName, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    console.debug('[analytics]', name, props);
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (w.gtag) w.gtag('event', name, props);
  }
}
