type EventName =
  | 'page_view'
  | 'marketing_cta_click'
  | 'waitlist_submit'
  | 'signup_start'
  | 'signup_complete'
  | 'first_plant_added'
  | 'first_dr_plant_message'
  | 'first_task_completed'
  | 'guide_link_click'
  | 'guide_dr_plant_click'
  | 'recommendation_view'
  | 'recommendation_done'
  | 'recommendation_snooze'
  | 'recommendation_dismiss'
  | 'recommendation_task_convert'
  | 'plant_added'
  | 'task_completed'
  | 'diagnosis_submitted'
  | 'premium_upgrade'
  | 'buddy_created'
  | 'buddy_activity_completed'
  | 'buddy_shop_purchase'
  | 'buddy_journey_started'
  | 'buddy_journey_completed'
  | 'buddy_quest_claimed';

export function trackEvent(name: EventName, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    console.debug('[analytics]', name, props);
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (w.gtag) w.gtag('event', name, props);
  }
}

export function trackOnce(storageKey: string, name: EventName, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const key = `dr-plant:analytics:${storageKey}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, new Date().toISOString());
  } catch {
    // Private browsing and embedded webviews can reject localStorage; still emit.
  }
  trackEvent(name, props);
}
