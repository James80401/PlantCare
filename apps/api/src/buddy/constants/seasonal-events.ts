export interface SeasonalEventDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  /** Inclusive start (month 1–12, day 1–31). */
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  shopItemIds: string[];
}

export const SEASONAL_EVENTS: SeasonalEventDefinition[] = [
  {
    id: 'spring_garden_2026',
    title: 'Spring Garden',
    description: 'Limited spring décor and bonus season-check sunlight.',
    emoji: '🌷',
    startMonth: 3,
    startDay: 1,
    endMonth: 5,
    endDay: 31,
    shopItemIds: ['hat_spring_wreath', 'furn_spring_planter', 'top_spring_cardigan'],
  },
  {
    id: 'summer_sun_2026',
    title: 'Summer Sun',
    description: 'Bright companions and patio vibes for long days.',
    emoji: '☀️',
    startMonth: 6,
    startDay: 1,
    endMonth: 8,
    endDay: 31,
    shopItemIds: ['hat_sun_visor', 'glasses_summer_shades', 'held_watering_can_gold'],
  },
  {
    id: 'autumn_harvest_2026',
    title: 'Autumn Harvest',
    description: 'Cozy terrarium pieces as nights grow longer.',
    emoji: '🍂',
    startMonth: 9,
    startDay: 1,
    endMonth: 11,
    endDay: 30,
    shopItemIds: ['hat_autumn_beret', 'furn_pumpkin_lantern', 'bg_autumn_porch'],
  },
  {
    id: 'winter_rest_2026',
    title: 'Winter Rest',
    description: 'Soft light accents while plants slow down.',
    emoji: '❄️',
    startMonth: 12,
    startDay: 1,
    endMonth: 2,
    endDay: 28,
    shopItemIds: ['hat_knit_beanie', 'furn_string_lights', 'top_cozy_scarf'],
  },
];

function eventDayValue(month: number, day: number): number {
  return month * 100 + day;
}

function isDateInRange(
  month: number,
  day: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const current = eventDayValue(month, day);
  const start = eventDayValue(startMonth, startDay);
  const end = eventDayValue(endMonth, endDay);
  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

export function getActiveSeasonalEvent(at = new Date()): SeasonalEventDefinition | null {
  const month = at.getMonth() + 1;
  const day = at.getDate();
  return (
    SEASONAL_EVENTS.find((e) =>
      isDateInRange(month, day, e.startMonth, e.startDay, e.endMonth, e.endDay),
    ) ?? null
  );
}

export function isSeasonalItemAvailable(
  seasonalEventId: string | null | undefined,
  at = new Date(),
): boolean {
  if (!seasonalEventId) return true;
  const active = getActiveSeasonalEvent(at);
  return active?.id === seasonalEventId;
}
