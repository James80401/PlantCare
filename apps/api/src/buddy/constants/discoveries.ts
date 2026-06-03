export interface DiscoveryDef {
  id: string;
  biomeId: string;
  title: string;
  encounterName: string;
  encounterRole: 'friend' | 'guide' | 'frenemy' | 'wanderer';
  encounterMood: string;
  rewardFocus: 'dewdrops' | 'comfort' | 'curiosity' | 'adventure' | 'focus';
  story: string;
  choiceA: string;
  choiceB: string;
  outcomeA: string;
  outcomeB: string;
}

export const DISCOVERIES: DiscoveryDef[] = [
  {
    id: 'seed_mushroom_circle',
    biomeId: 'seed_garden',
    title: 'Buttoncap Circle',
    encounterName: 'Buttoncap Beetle',
    encounterRole: 'friend',
    encounterMood: 'curious and careful',
    rewardFocus: 'curiosity',
    story:
      'While exploring the soft soil of the seed garden, {name} found a perfect ring of tiny mushrooms around a smooth stone. A beetle rested at the center, very still.',
    choiceA: '{name} looked closer at the mushroom caps.',
    choiceB: '{name} gave the beetle space and tiptoed past.',
    outcomeA:
      'The beetle clicked happily and showed {name} a safe shortcut through the mushroom ring.',
    outcomeB:
      'The beetle relaxed as {name} passed quietly, leaving a tiny polished seed by the trail.',
  },
  {
    id: 'seed_dew_drop',
    biomeId: 'seed_garden',
    title: 'First Dewlight',
    encounterName: 'Dewdrop Sprite',
    encounterRole: 'guide',
    encounterMood: 'gentle and bright',
    rewardFocus: 'dewdrops',
    story:
      '{name} caught a single dewdrop sliding down a blade of grass at sunrise. For a moment the whole garden sparkled.',
    choiceA: '{name} tried to catch the light in a leaf cup.',
    choiceB: '{name} sat quietly and watched it fall.',
    outcomeA:
      'The leaf cup filled with a little shimmer, and the sprite taught {name} how to spot morning rewards.',
    outcomeB:
      'The sprite noticed the patience and left the quietest sparkle tucked behind a pebble.',
  },
  {
    id: 'forest_moss_stone',
    biomeId: 'forest_floor',
    title: 'Moss Spiral',
    encounterName: 'Moss Mender',
    encounterRole: 'guide',
    encounterMood: 'patient and kind',
    rewardFocus: 'comfort',
    story:
      'On the forest floor, {name} discovered moss growing in a spiral on an old stone. The air smelled like rain and pine.',
    choiceA: '{name} pressed a leaf into the moss to remember the pattern.',
    choiceB: '{name} hummed a little tune and kept exploring.',
    outcomeA:
      "The Moss Mender approved of the careful note-taking and tucked a soft rest charm into {name}'s pack.",
    outcomeB:
      'The moss answered with a tiny rustle, turning the tune into a path marker for later journeys.',
  },
  {
    id: 'forest_woodland_trail',
    biomeId: 'forest_floor',
    title: 'Acorn Trail',
    encounterName: 'Acorn Trickster',
    encounterRole: 'frenemy',
    encounterMood: 'playful but suspicious',
    rewardFocus: 'adventure',
    story:
      'A narrow trail of acorn caps led {name} under a fallen log. Something shiny peeked out from the roots.',
    choiceA: '{name} followed the trail to the end.',
    choiceB: '{name} turned back to check on your plants at home.',
    outcomeA:
      'The Acorn Trickster popped out laughing, then admitted {name} was brave enough to earn the shiny prize.',
    outcomeB:
      'The trickster grumbled, but respected the loyalty and rolled one acorn cap back toward home.',
  },
  {
    id: 'desert_oasis_sun_skip',
    biomeId: 'desert_oasis',
    title: 'Sun-Skipper Race',
    encounterName: 'Sun-skipper',
    encounterRole: 'wanderer',
    encounterMood: 'bold and warm',
    rewardFocus: 'focus',
    story:
      'At the edge of the oasis, {name} met a bright Sun-skipper bouncing between warm stones and cool shade.',
    choiceA: '{name} raced between the shade stones.',
    choiceB: '{name} studied the pattern before moving.',
    outcomeA:
      'The Sun-skipper cheered at the dash and showed {name} where the fastest trail bends.',
    outcomeB:
      'The Sun-skipper nodded at the careful timing and marked the safest rest spot in the sand.',
  },
  {
    id: 'desert_oasis_glass_seed',
    biomeId: 'desert_oasis',
    title: 'Glass Seed',
    encounterName: 'Oasis Keeper',
    encounterRole: 'guide',
    encounterMood: 'watchful and calm',
    rewardFocus: 'dewdrops',
    story:
      '{name} found a glassy seed half-buried where the oasis water met the sand. It was cool even in the sun.',
    choiceA: '{name} rinsed the seed in the oasis.',
    choiceB: '{name} carried it carefully back in a leaf wrap.',
    outcomeA:
      'The Oasis Keeper smiled as the seed cleared, revealing a dewdrop map inside.',
    outcomeB:
      'The wrapped seed stayed safe, and the Keeper traded {name} a small bundle of bright sand pearls.',
  },
];

export function pickDiscovery(biomeId: string, name: string): DiscoveryDef {
  const pool = DISCOVERIES.filter((d) => d.biomeId === biomeId);
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? DISCOVERIES[0];
  return {
    ...pick,
    story: pick.story.replace(/\{name\}/g, name),
    choiceA: pick.choiceA.replace(/\{name\}/g, name),
    choiceB: pick.choiceB.replace(/\{name\}/g, name),
    outcomeA: pick.outcomeA.replace(/\{name\}/g, name),
    outcomeB: pick.outcomeB.replace(/\{name\}/g, name),
  };
}
