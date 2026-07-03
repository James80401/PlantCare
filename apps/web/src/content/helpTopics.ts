export interface HelpTopic {
  title: string;
  tips: string[];
}

/**
 * Content for the per-screen "?" help buttons. Keep entries short (2-4 tips,
 * one short sentence each) — a prior structured onboarding flow was disliked
 * for feeling cumbersome and blocking, so this is deliberately the opposite:
 * optional, skimmable, and closed with one tap.
 */
export const HELP_TOPICS = {
  dashboard: {
    title: 'Your garden at a glance',
    tips: [
      "Today's care and anything overdue always show up first.",
      'The attention list flags plants that need a look — missed care, no upcoming task, or a recent health issue.',
      "Recommendations are optional suggestions, not tasks — dismiss, snooze, or turn one into a task if it's useful.",
    ],
  },
  'gardens-list': {
    title: 'Gardens',
    tips: [
      'A garden groups plants together — by room, by household, or however makes sense to you.',
      'Create a garden here, then add plants to it from Add Plant.',
      'Shared gardens (from an invite) show up in this list too.',
    ],
  },
  'garden-detail': {
    title: 'This garden',
    tips: [
      'See every plant, task, and note for this garden in one place.',
      'Manage who can help with this garden from Members.',
    ],
  },
  'garden-plants': {
    title: 'Plants in this garden',
    tips: ['Tap a plant to open its full profile — care guide, tasks, journal, and health history.'],
  },
  'garden-members': {
    title: 'Household members',
    tips: [
      'Invite someone by email, or share a link — they can accept from any device.',
      'Caregivers can complete tasks; viewers can only look.',
      'You control which plants each member can journal on when you share them.',
    ],
  },
  household: {
    title: 'Care Share',
    tips: [
      'Share individual plants with your household so others can help with watering and tasks.',
      "The 'allow journal entries' checkbox controls whether caregivers can add notes and photos to a shared plant.",
    ],
  },
  'plant-overview': {
    title: 'Plant overview',
    tips: [
      "Quick snapshot: next task, location, and this plant's basics.",
      'Edit nickname, pot size, notes, or photo any time from here.',
    ],
  },
  'plant-care': {
    title: 'Care guide',
    tips: [
      'Personalized to this plant — season, pot size, and location all factor in.',
      'Switch between beginner and advanced detail with the toggle.',
    ],
  },
  'plant-tasks': {
    title: 'Tasks for this plant',
    tips: [
      'Complete, skip, or snooze — skipping asks why, which helps future schedules adapt.',
      'Tap a task to see exactly why it\'s due now.',
    ],
  },
  'plant-journal': {
    title: 'Journal',
    tips: [
      'Log notes, photos, and measurements over time to build a growth story.',
      'Add a Plant Check-In for a quick AI read on how this plant is trending.',
    ],
  },
  'plant-health': {
    title: 'Health & diagnosis',
    tips: [
      'Snap a photo and describe symptoms for an AI-assisted diagnosis and treatment plan.',
      'Dr. Plant chat can draft follow-up tasks or notes — nothing is created until you confirm it.',
    ],
  },
  tasks: {
    title: 'Care tasks',
    tips: [
      'Tasks are grouped into rounds by garden and care type so you can knock out several at once.',
      'Bulk-complete a whole round in one tap.',
    ],
  },
  calendar: {
    title: 'Calendar',
    tips: ['See what\'s due across every garden by day or week — tap a day to see and act on its tasks.'],
  },
  'add-plant': {
    title: 'Adding a plant',
    tips: [
      'Snap a photo for AI identification, or search for the species yourself.',
      "Pot size, location, and life stage all shape the care schedule we build — it's fine to adjust these later.",
    ],
  },
  settings: {
    title: 'Settings',
    tips: [
      'Notification channels (push, email, SMS) and quiet hours live here.',
      'Location powers optional weather-aware care advice — it\'s never used for anything else.',
    ],
  },
  subscription: {
    title: 'Premium',
    tips: ['See your current plan, usage, and what Premium unlocks.'],
  },
  community: {
    title: 'Plant tips & wins',
    tips: [
      'Share a photo or a quick note with other plant people.',
      'Tag a species so others browsing that plant can find your post.',
    ],
  },
  'browse-species': {
    title: 'Browse species',
    tips: [
      'Filter by light, difficulty, pet safety, and more.',
      'Recommended picks are based on your experience level and light settings.',
    ],
  },
  'species-detail': {
    title: 'Species details',
    tips: ['Light, water, and toxicity info here — use "Add to my garden" to start tracking one of your own.'],
  },
  buddy: {
    title: 'Plant Buddy',
    tips: [
      'A companion that grows alongside your real care habits — completing tasks earns XP and rewards.',
      'Explore Journeys, Quests, Style, and the Shop from here — all entirely optional.',
    ],
  },
} as const satisfies Record<string, HelpTopic>;

export type HelpTopicKey = keyof typeof HELP_TOPICS;
