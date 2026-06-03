import { describe, expect, it } from 'vitest';
import { mapTimelineFromApi } from './plantTimeline';

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
