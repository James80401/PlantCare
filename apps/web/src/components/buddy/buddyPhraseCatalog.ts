import type { BuddyTrait } from '../../hooks/buddy/types';
import type { TimeOfDay } from './buddyPhraseContext';

export interface BuddyPhraseWhen {
  traveling?: boolean;
  journeyReady?: boolean;
  minStreak?: number;
  minSunlight?: number;
  maxSunlight?: number;
  minDewdrops?: number;
  mood?: string | string[];
  trait?: BuddyTrait | BuddyTrait[];
  speciesId?: string | string[];
  growthStage?: string | string[];
  timeOfDay?: TimeOfDay | TimeOfDay[];
  overdueGt?: number;
  overdueEq?: number;
  dueTodayGt?: number;
  dueTodayEq?: number;
  completedTodayGt?: number;
  totalPlantsEq?: number;
  totalPlantsGt?: number;
  weatherRainHint?: boolean;
}

export interface BuddyPhraseEntry {
  id: string;
  text: string;
  tags: string[];
  priority?: number;
  when?: BuddyPhraseWhen;
}

const TRAITS: BuddyTrait[] = ['RESILIENT', 'SUN_SEEKER', 'NIGHT_BLOOMER', 'WILD', 'TENDER'];
const SPECIES = ['monstera', 'cactus', 'succulent', 'snake_plant', 'fern'] as const;

const general: BuddyPhraseEntry[] = [
  { id: 'gen-01', text: 'You’re doing great — one leaf at a time!', tags: ['general'], priority: 1 },
  { id: 'gen-02', text: 'Your garden is lucky to have you.', tags: ['general'], priority: 1 },
  { id: 'gen-03', text: 'Small care today, big growth tomorrow.', tags: ['general'], priority: 1 },
  { id: 'gen-04', text: 'Take a breath — your plants feel your calm.', tags: ['general'], priority: 1 },
  { id: 'gen-05', text: 'Consistency beats perfection. Keep showing up!', tags: ['general'], priority: 1 },
  { id: 'gen-06', text: 'Every watered pot is a win.', tags: ['general'], priority: 1 },
  { id: 'gen-07', text: 'You’ve got a green thumb in the making.', tags: ['general'], priority: 1 },
  { id: 'gen-08', text: 'Rest is part of plant care too.', tags: ['general'], priority: 1 },
  { id: 'gen-09', text: 'Celebrate the little sprouts along the way.', tags: ['general'], priority: 1 },
  { id: 'gen-10', text: 'Your effort is already making a difference.', tags: ['general'], priority: 1 },
  { id: 'gen-11', text: 'Today is a good day to check in on a friend (plant).', tags: ['general'], priority: 1 },
  { id: 'gen-12', text: 'Growth happens in quiet moments.', tags: ['general'], priority: 1 },
  { id: 'gen-13', text: 'You’re building something beautiful here.', tags: ['general'], priority: 1 },
  { id: 'gen-14', text: 'Mistakes mean you’re learning — plants forgive.', tags: ['general'], priority: 1 },
  { id: 'gen-15', text: 'Sunlight, water, and kindness go a long way.', tags: ['general'], priority: 1 },
  { id: 'gen-16', text: 'Your care routine is adding up!', tags: ['general'], priority: 1 },
  { id: 'gen-17', text: 'Proud of you for tending your little ecosystem.', tags: ['general'], priority: 1 },
  { id: 'gen-18', text: 'Even five minutes of care counts.', tags: ['general'], priority: 1 },
  { id: 'gen-19', text: 'You make this garden feel alive.', tags: ['general'], priority: 1 },
  { id: 'gen-20', text: 'Keep going — {name} believes in you!', tags: ['general'], priority: 1 },
  { id: 'gen-21', text: '{name} is glad you stopped by the garden.', tags: ['general'], priority: 1 },
  { id: 'gen-22', text: 'Tiny steps still move the whole garden forward.', tags: ['general'], priority: 1 },
  { id: 'gen-23', text: 'Your patience is a superpower here.', tags: ['general'], priority: 1 },
  { id: 'gen-24', text: 'Plants remember gentle hands.', tags: ['general'], priority: 1 },
  { id: 'gen-25', text: 'You’re the reason this place thrives.', tags: ['general'], priority: 1 },
  { id: 'gen-26', text: 'No rush — nature runs on its own clock.', tags: ['general'], priority: 1 },
  { id: 'gen-27', text: 'Curiosity is how great gardeners grow.', tags: ['general'], priority: 1 },
  { id: 'gen-28', text: 'One check-in can save a whole plant week.', tags: ['general'], priority: 1 },
  { id: 'gen-29', text: 'You’re writing a lovely garden story.', tags: ['general'], priority: 1 },
  { id: 'gen-30', text: '{name} is rooting for you — literally!', tags: ['general'], priority: 1 },
  { id: 'gen-31', text: 'Kindness to plants is kindness to yourself.', tags: ['general'], priority: 1 },
  { id: 'gen-32', text: 'Every season teaches something new.', tags: ['general'], priority: 1 },
  { id: 'gen-33', text: 'Your garden trusts you.', tags: ['general'], priority: 1 },
  { id: 'gen-34', text: 'Slow and steady wins the leaf race.', tags: ['general'], priority: 1 },
  { id: 'gen-35', text: 'You show up — that matters most.', tags: ['general'], priority: 1 },
  { id: 'gen-36', text: 'A calm gardener grows calm plants.', tags: ['general'], priority: 1 },
  { id: 'gen-37', text: 'Celebrate progress, not perfection.', tags: ['general'], priority: 1 },
  { id: 'gen-38', text: '{name} thinks you’re doing amazing.', tags: ['general'], priority: 1 },
  { id: 'gen-39', text: 'Little wins stack into big green joy.', tags: ['general'], priority: 1 },
  { id: 'gen-40', text: 'This garden is your happy place too.', tags: ['general'], priority: 1 },
];

const tasks: BuddyPhraseEntry[] = [
  { id: 'task-over-1', text: '{overdue} task(s) waiting — {name} will cheer while you tackle one!', tags: ['tasks'], priority: 8, when: { overdueGt: 0 } },
  { id: 'task-over-2', text: 'Overdue care? Start with the thirstiest plant. You’ve got this.', tags: ['tasks'], priority: 8, when: { overdueGt: 0 } },
  { id: 'task-over-3', text: '{name} believes one overdue task today is enough.', tags: ['tasks'], priority: 7, when: { overdueGt: 0 } },
  { id: 'task-over-4', text: 'No guilt — just the next small step in the garden.', tags: ['tasks'], priority: 7, when: { overdueGt: 0 } },
  { id: 'task-over-5', text: 'Your plants will perk up when you show up. Start with one.', tags: ['tasks'], priority: 7, when: { overdueGt: 0 } },
  { id: 'task-today-1', text: '{dueToday} due today — a quick round keeps everyone happy.', tags: ['tasks'], priority: 7, when: { dueTodayGt: 0, overdueEq: 0 } },
  { id: 'task-today-2', text: '{name} is ready to celebrate each task you finish today!', tags: ['tasks'], priority: 7, when: { dueTodayGt: 0 } },
  { id: 'task-today-3', text: 'Today’s list is manageable — one plant at a time.', tags: ['tasks'], priority: 6, when: { dueTodayGt: 0 } },
  { id: 'task-done-1', text: 'You finished {completedToday} today — {name} is doing a happy dance!', tags: ['tasks'], priority: 9, when: { completedTodayGt: 0 } },
  { id: 'task-done-2', text: 'All that care today? Your garden feels it. Well done!', tags: ['tasks'], priority: 8, when: { completedTodayGt: 0 } },
  { id: 'task-done-3', text: '{name} is glowing after your {completedToday} completed task(s)!', tags: ['tasks'], priority: 8, when: { completedTodayGt: 0 } },
  { id: 'task-clear-1', text: 'Nothing due right now — enjoy the calm green moment.', tags: ['tasks'], priority: 7, when: { overdueEq: 0, dueTodayEq: 0, totalPlantsGt: 0 } },
  { id: 'task-clear-2', text: '{name} says: all caught up! Maybe add a journal note?', tags: ['tasks'], priority: 7, when: { overdueEq: 0, dueTodayEq: 0, totalPlantsGt: 0 } },
  { id: 'task-clear-3', text: 'Clear schedule today — perfect day to browse new species.', tags: ['tasks'], priority: 6, when: { overdueEq: 0, dueTodayEq: 0 } },
  { id: 'task-noplants-1', text: 'No plants yet? {name} can’t wait to meet your first one!', tags: ['tasks'], priority: 9, when: { totalPlantsEq: 0 } },
  { id: 'task-noplants-2', text: 'An empty garden is just a blank canvas. Add a plant when you’re ready!', tags: ['tasks'], priority: 8, when: { totalPlantsEq: 0 } },
  { id: 'task-mix-1', text: '{overdue} overdue and {dueToday} due today — prioritize overdue first.', tags: ['tasks'], priority: 9, when: { overdueGt: 0, dueTodayGt: 0 } },
  { id: 'task-mix-2', text: 'Busy garden day! {name} is here for moral support.', tags: ['tasks'], priority: 7, when: { dueTodayGt: 0 } },
  { id: 'task-streak-care', text: 'Care tasks fuel {name}’s sunlight — keep the streak going!', tags: ['tasks'], priority: 6, when: { dueTodayGt: 0 } },
  { id: 'task-encourage-1', text: 'Open Tasks when you’re ready — no pressure, just plants.', tags: ['tasks'], priority: 5, when: { totalPlantsGt: 0 } },
  { id: 'task-encourage-2', text: '{name} spotted a task that might love your attention today.', tags: ['tasks'], priority: 6, when: { dueTodayGt: 0 } },
  { id: 'task-encourage-3', text: 'Completing one task fills my sunlight bar. Thank you!', tags: ['tasks'], priority: 6, when: { dueTodayGt: 0 } },
  { id: 'task-encourage-4', text: 'Your plants are whispering “thanks” for yesterday’s care.', tags: ['tasks'], priority: 5, when: { completedTodayGt: 0 } },
  { id: 'task-encourage-5', text: 'Garden score looking good — steady care pays off.', tags: ['tasks'], priority: 5, when: { completedTodayGt: 0, overdueEq: 0 } },
];

const buddyState: BuddyPhraseEntry[] = [
  { id: 'sun-full', text: 'Sunlight bar full — I’m ready for a grow journey!', tags: ['buddy'], priority: 9, when: { journeyReady: true, traveling: false } },
  { id: 'sun-high', text: '{sunlightToday}/100 sunlight today. Almost journey-ready!', tags: ['buddy'], priority: 7, when: { minSunlight: 70, maxSunlight: 99, traveling: false } },
  { id: 'sun-low', text: 'Complete a care task to fill my sunlight — let’s grow together.', tags: ['buddy'], priority: 7, when: { maxSunlight: 40, traveling: false } },
  { id: 'sun-mid', text: '{sunlightToday} sunlight so far. Keep those tasks coming!', tags: ['buddy'], priority: 6, when: { minSunlight: 41, maxSunlight: 69, traveling: false } },
  { id: 'streak-3', text: '{streakDays}-day streak! {name} is impressed.', tags: ['buddy'], priority: 8, when: { minStreak: 3 } },
  { id: 'streak-7', text: 'A whole week of showing up — you’re amazing!', tags: ['buddy'], priority: 9, when: { minStreak: 7 } },
  { id: 'streak-14', text: '{streakDays} days strong. {name} wants a high-five!', tags: ['buddy'], priority: 9, when: { minStreak: 14 } },
  { id: 'dew-1', text: '{dewdrops} dewdrops saved up — visit the shop!', tags: ['buddy'], priority: 6, when: { minDewdrops: 50 } },
  { id: 'mood-thrive', text: 'I’m thriving thanks to you!', tags: ['buddy'], priority: 7, when: { mood: 'THRIVING' } },
  { id: 'mood-happy', text: 'Happy leaves, happy {name}!', tags: ['buddy'], priority: 6, when: { mood: ['HAPPY', 'CONTENT'] } },
  { id: 'mood-wilt', text: 'I’m a little wilted — extra care would help us both.', tags: ['buddy'], priority: 8, when: { mood: 'WILTING' } },
  { id: 'mood-thirst', text: 'Feeling thirsty — maybe check today’s water tasks?', tags: ['buddy'], priority: 8, when: { mood: 'THIRSTY' } },
  { id: 'mood-dormant', text: 'Quiet mode today. I’ll perk up when we care together.', tags: ['buddy'], priority: 7, when: { mood: 'DORMANT' } },
  { id: 'stage-seed', text: 'Still a little seed — every task helps me grow!', tags: ['buddy'], priority: 6, when: { growthStage: 'SEED' } },
  { id: 'stage-sprout', text: 'Sprouting up! Thanks for the steady care.', tags: ['buddy'], priority: 6, when: { growthStage: ['SPROUT', 'SEEDLING'] } },
  { id: 'stage-young', text: 'Getting bigger every journey. You did that!', tags: ['buddy'], priority: 6, when: { growthStage: 'YOUNG_PLANT' } },
  { id: 'stage-established', text: 'An established buddy for an established gardener.', tags: ['buddy'], priority: 6, when: { growthStage: ['ESTABLISHED', 'ANCIENT'] } },
  { id: 'buddy-cheer', text: '{name} is cheering you on!', tags: ['buddy'], priority: 5 },
  { id: 'buddy-quest', text: 'Check quests for extra dewdrops today!', tags: ['buddy'], priority: 5, when: { traveling: false } },
  { id: 'buddy-activity', text: 'Activities earn sunlight too — try a quick check-in!', tags: ['buddy'], priority: 5, when: { traveling: false } },
  { id: 'buddy-town', text: 'Garden Town friends would love some sunshine from you.', tags: ['buddy'], priority: 4, when: { traveling: false } },
  { id: 'buddy-journey-soon', text: 'Fill my bar and we can explore a new biome!', tags: ['buddy'], priority: 6, when: { traveling: false, journeyReady: false } },
  { id: 'buddy-name-1', text: 'It’s me, {name} — your plant pal!', tags: ['buddy'], priority: 3 },
  { id: 'buddy-name-2', text: '{name} reporting: garden vibes are good.', tags: ['buddy'], priority: 3 },
];

const journey: BuddyPhraseEntry[] = [
  { id: 'j-travel-1', text: 'I’m exploring {biomeName} — back before you know it!', tags: ['journey'], priority: 10, when: { traveling: true } },
  { id: 'j-travel-2', text: 'On a grow journey! Complete tasks to help me return sooner.', tags: ['journey'], priority: 10, when: { traveling: true } },
  { id: 'j-travel-3', text: '{name} is traveling — saving stories for when I’m home.', tags: ['journey'], priority: 9, when: { traveling: true } },
  { id: 'j-travel-4', text: 'Adventure mode in {biomeName}! Wish me luck.', tags: ['journey'], priority: 9, when: { traveling: true } },
  { id: 'j-travel-5', text: 'I’ll bring back dewdrops from {biomeName}!', tags: ['journey'], priority: 8, when: { traveling: true } },
  { id: 'j-travel-6', text: 'Missing you a little — see you when the journey ends!', tags: ['journey'], priority: 8, when: { traveling: true } },
  { id: 'j-travel-7', text: 'Traveling through {biomeName}… so many leaves to see!', tags: ['journey'], priority: 8, when: { traveling: true } },
  { id: 'j-travel-8', text: 'Your care powers my trip. Thank you!', tags: ['journey'], priority: 7, when: { traveling: true } },
  { id: 'j-ready-1', text: 'Journey-ready! Tap Journey when you want to send me off.', tags: ['journey'], priority: 8, when: { journeyReady: true, traveling: false } },
  { id: 'j-ready-2', text: 'My sunlight is full — ready for our next biome!', tags: ['journey'], priority: 8, when: { journeyReady: true, traveling: false } },
  { id: 'j-ready-3', text: '{name} packed a tiny bag. Where should we explore?', tags: ['journey'], priority: 7, when: { journeyReady: true, traveling: false } },
  { id: 'j-ready-4', text: 'Grow journey unlocked! I’m excited.', tags: ['journey'], priority: 7, when: { journeyReady: true, traveling: false } },
  { id: 'j-post-1', text: 'Welcome back from last journey — ready to grow again?', tags: ['journey'], priority: 5, when: { traveling: false } },
  { id: 'j-post-2', text: 'Biomes await. Fill sunlight and let’s go!', tags: ['journey'], priority: 5, when: { traveling: false } },
  { id: 'j-post-3', text: 'Every journey makes me stronger. Thanks for sending me!', tags: ['journey'], priority: 5, when: { traveling: false } },
];

const timeOfDay: BuddyPhraseEntry[] = [
  { id: 'tod-morn-1', text: 'Good morning! Perfect time for a quick plant check.', tags: ['time'], priority: 6, when: { timeOfDay: 'morning' } },
  { id: 'tod-morn-2', text: '{name} loves morning light — and morning gardeners.', tags: ['time'], priority: 6, when: { timeOfDay: 'morning' } },
  { id: 'tod-morn-3', text: 'Rise and shine, garden hero!', tags: ['time'], priority: 5, when: { timeOfDay: 'morning' } },
  { id: 'tod-aft-1', text: 'Afternoon check-in? Your plants will appreciate it.', tags: ['time'], priority: 6, when: { timeOfDay: 'afternoon' } },
  { id: 'tod-aft-2', text: 'Midday mood: calm, green, and growing.', tags: ['time'], priority: 5, when: { timeOfDay: 'afternoon' } },
  { id: 'tod-aft-3', text: '{name} is soaking up the afternoon with you.', tags: ['time'], priority: 5, when: { timeOfDay: 'afternoon' } },
  { id: 'tod-eve-1', text: 'Evening care counts too — unwind with your plants.', tags: ['time'], priority: 6, when: { timeOfDay: 'evening' } },
  { id: 'tod-eve-2', text: 'Soft evening light is gentle on leaves.', tags: ['time'], priority: 5, when: { timeOfDay: 'evening' } },
  { id: 'tod-eve-3', text: '{name} is winding down — thanks for today.', tags: ['time'], priority: 5, when: { timeOfDay: 'evening' } },
  { id: 'tod-night-1', text: 'Night owl gardener? I’m here with you.', tags: ['time'], priority: 6, when: { timeOfDay: 'night' } },
  { id: 'tod-night-2', text: 'Quiet night in the garden. Rest well soon.', tags: ['time'], priority: 5, when: { timeOfDay: 'night' } },
  { id: 'tod-night-3', text: '{name} glows softly in the moonlit garden.', tags: ['time'], priority: 5, when: { timeOfDay: 'night', trait: 'NIGHT_BLOOMER' } },
];

const traitPhrases: BuddyPhraseEntry[] = TRAITS.flatMap((trait) => {
  const lines: Record<BuddyTrait, string[]> = {
    RESILIENT: [
      'I bounce back — and so will your garden.',
      'Missed a day? We keep going. That’s resilience.',
      'Sturdy roots, sturdy heart. You’ve got this.',
      'Setbacks are just compost for growth.',
      'I’m tough — you’re tougher.',
    ],
    SUN_SEEKER: [
      'Let’s chase the sunny spot together!',
      'Bright light, bright mood — check your sun lovers.',
      'I lean toward the window. Plants do too.',
      'Sun task day? Perfect for us sun seekers.',
      'Golden hour energy in the garden!',
    ],
    NIGHT_BLOOMER: [
      'Evening care is my favorite time.',
      'Quiet hours are when roots do their magic.',
      'Moonlight garden vibes — peaceful and green.',
      'Night check-ins count just as much.',
      'Soft light, soft steps — gentle care wins.',
    ],
    WILD: [
      'Let’s explore — maybe a new species today?',
      'Wild heart, tidy tasks. Balance is fun!',
      'Adventure awaits in every leaf.',
      'I love a surprise sprout. Keep exploring!',
      'Playful care day? I’m all in.',
    ],
    TENDER: [
      'Gentle hands grow gentle gardens.',
      'Take it slow — your plants feel the care.',
      'Soft words, soft watering. I’m here.',
      'Tender moments matter most.',
      'A little kindness goes to every leaf.',
    ],
  };
  return lines[trait].map((text, i) => ({
    id: `trait-${trait.toLowerCase()}-${i + 1}`,
    text,
    tags: ['trait'],
    priority: 6,
    when: { trait },
  }));
});

const speciesPhrases: BuddyPhraseEntry[] = SPECIES.flatMap((speciesId) => {
  const lines: Record<(typeof SPECIES)[number], string[]> = {
    monstera: [
      'Monty says: dramatic leaves need steady love!',
      'Split leaves, big dreams — that’s us monsteras.',
      'Cheerful and bold — like your garden!',
      'Monty’s rooting for every new leaf.',
      'Tropical vibes from your pal Monty!',
    ],
    cactus: [
      'Spike here — slow and steady wins.',
      'Independent plants, loyal gardener. Nice combo.',
      'Spike doesn’t wilt easily — neither should you.',
      'Desert tough, garden soft. I like it here.',
      'Spike approves of your patience.',
    ],
    succulent: [
      'Rosie loves celebrating small wins!',
      'Compact joy — that’s succulent life.',
      'Rosie says your care is blooming.',
      'Little plant, big heart. Hi, it’s Rosie!',
      'Rosie’s cheering for today’s tasks!',
    ],
    snake_plant: [
      'Sage prefers calm, steady routines.',
      'Upward leaves, upward mood — Sage approves.',
      'Sage is your steady green sidekick.',
      'Low fuss, high care — perfect match.',
      'Sage whispers: you’re doing fine.',
    ],
    fern: [
      'Fernie loves a good humidity check!',
      'Curious fronds, curious gardener — explore!',
      'Fernie says misting day maybe?',
      'Gentle greens are happy greens.',
      'Fernie’s glad you’re here.',
    ],
  };
  return lines[speciesId].map((text, i) => ({
    id: `species-${speciesId}-${i + 1}`,
    text,
    tags: ['species'],
    priority: 5,
    when: { speciesId },
  }));
});

const weather: BuddyPhraseEntry[] = [
  { id: 'wx-rain-1', text: 'Rainy vibes — indoor plant checks sound perfect.', tags: ['weather'], priority: 8, when: { weatherRainHint: true } },
  { id: 'wx-rain-2', text: '{name} brought an umbrella for your garden mood.', tags: ['weather'], priority: 7, when: { weatherRainHint: true } },
  { id: 'wx-rain-3', text: 'Forecast rain? Group your water tasks smartly.', tags: ['weather'], priority: 7, when: { weatherRainHint: true } },
];

export const BUDDY_PHRASE_CATALOG: BuddyPhraseEntry[] = [
  ...general,
  ...tasks,
  ...buddyState,
  ...journey,
  ...timeOfDay,
  ...traitPhrases,
  ...speciesPhrases,
  ...weather,
];
