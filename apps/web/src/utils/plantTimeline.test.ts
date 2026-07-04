import { describe, expect, it } from 'vitest';
import type { TimelineEvent } from '../pages/plant-profile/types';
import {
  countTimelineByType,
  filterTimelineEvents,
  mapTimelineFromApi,
} from './plantTimeline';

describe('mapTimelineFromApi', () => {
  it('parses ISO dates into Date objects', () => {
    const events = mapTimelineFromApi([
      {
        id: 'journal-1',
        date: '2026-03-01T12:00:00.000Z',
        type: 'journal',
        title: 'Journal note',
        description: 'Growing',
        journalId: '1',
      },
    ]);

    expect(events[0].date).toBeInstanceOf(Date);
    expect(events[0].journalId).toBe('1');
  });
});

describe('timeline filtering', () => {
  const makeEvent = (type: TimelineEvent['type'], id: string): TimelineEvent => ({
    id,
    date: new Date('2026-03-01'),
    type,
    title: id,
    description: '',
  });
  const events = [
    makeEvent('journal', 'j1'),
    makeEvent('journal', 'j2'),
    makeEvent('care', 'c1'),
    makeEvent('diagnosis', 'd1'),
  ];

  it('counts events per type', () => {
    expect(countTimelineByType(events)).toEqual({
      all: 4,
      journal: 2,
      care: 1,
      diagnosis: 1,
      progress: 0,
    });
  });

  it('returns all events for the "all" filter', () => {
    expect(filterTimelineEvents(events, 'all')).toHaveLength(4);
  });

  it('narrows to a single type', () => {
    expect(filterTimelineEvents(events, 'journal').map((e) => e.id)).toEqual(['j1', 'j2']);
    expect(filterTimelineEvents(events, 'diagnosis').map((e) => e.id)).toEqual(['d1']);
  });
});
