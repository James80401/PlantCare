export interface DiscoveryDef {
  id: string;
  biomeId: string;
  story: string;
  choiceA: string;
  choiceB: string;
}

export const DISCOVERIES: DiscoveryDef[] = [
  {
    id: 'seed_mushroom_circle',
    biomeId: 'seed_garden',
    story:
      'While exploring the soft soil of the seed garden, {name} found a perfect ring of tiny mushrooms around a smooth stone. A beetle rested at the center, very still.',
    choiceA: '{name} looked closer — so many colors on the caps!',
    choiceB: '{name} gave the beetle space and tiptoed past.',
  },
  {
    id: 'seed_dew_drop',
    biomeId: 'seed_garden',
    story:
      '{name} caught a single dewdrop sliding down a blade of grass at sunrise. For a moment the whole garden sparkled.',
    choiceA: '{name} tried to catch the light in a leaf cup.',
    choiceB: '{name} sat quietly and watched it fall.',
  },
  {
    id: 'forest_moss_stone',
    biomeId: 'forest_floor',
    story:
      'On the forest floor, {name} discovered moss growing in a spiral on an old stone. The air smelled like rain and pine.',
    choiceA: '{name} pressed a leaf into the moss to remember the pattern.',
    choiceB: '{name} hummed a little tune and kept exploring.',
  },
  {
    id: 'forest_woodland_trail',
    biomeId: 'forest_floor',
    story:
      'A narrow trail of acorn caps led {name} under a fallen log. Something shiny peeked out — a beetle wing catching the light.',
    choiceA: '{name} followed the trail to the end.',
    choiceB: '{name} turned back to check on your plants at home.',
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
  };
}
