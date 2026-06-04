import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PlantTimeline } from './shared';
import type { TimelineEvent } from './types';

function event(type: TimelineEvent['type'], id: string, title: string): TimelineEvent {
  return { id, type, title, description: `${title} body`, date: new Date('2026-03-01T10:00:00Z') };
}

describe('PlantTimeline filters', () => {
  it('hides filter chips for short timelines', () => {
    render(
      <PlantTimeline
        events={[
          event('journal', 'j1', 'Note one'),
          event('journal', 'j2', 'Note two'),
          event('care', 'c1', 'Watered'),
        ]}
      />,
    );

    expect(screen.queryByRole('group', { name: /filter timeline/i })).not.toBeInTheDocument();
    expect(screen.getByText('Note one')).toBeInTheDocument();
  });

  it('shows filter chips and narrows events when a type is selected', () => {
    const events: TimelineEvent[] = [
      event('journal', 'j1', 'Journal A'),
      event('journal', 'j2', 'Journal B'),
      event('journal', 'j3', 'Journal C'),
      event('care', 'c1', 'Care A'),
      event('care', 'c2', 'Care B'),
      event('diagnosis', 'd1', 'Diagnosis A'),
    ];
    render(<PlantTimeline events={events} />);

    const group = screen.getByRole('group', { name: /filter timeline/i });
    expect(group).toBeInTheDocument();
    // Chip labels include per-type counts.
    expect(screen.getByRole('button', { name: 'All 6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Care 2' })).toBeInTheDocument();

    // Everything visible under "All".
    expect(screen.getByText('Journal A')).toBeInTheDocument();
    expect(screen.getByText('Care A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Care 2' }));

    expect(screen.getByText('Care A')).toBeInTheDocument();
    expect(screen.getByText('Care B')).toBeInTheDocument();
    expect(screen.queryByText('Journal A')).not.toBeInTheDocument();
    expect(screen.queryByText('Diagnosis A')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Care 2' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not offer filters when every event is the same type', () => {
    const events = Array.from({ length: 8 }, (_, i) =>
      event('journal', `j${i}`, `Journal ${i}`),
    );
    render(<PlantTimeline events={events} />);

    expect(screen.queryByRole('group', { name: /filter timeline/i })).not.toBeInTheDocument();
  });
});
