import { BuddyMood } from '@prisma/client';
import { BuddyNotificationsListener } from './buddy-notifications.listener';

type Buddy = { id: string; userId: string; name: string; mood: BuddyMood };

function createListener(buddies: Buddy[], alreadyNudged = false) {
  const prisma = { buddy: { findMany: jest.fn().mockResolvedValue(buddies) } };
  const notifications = {
    hasBuddyNudgeToday: jest.fn().mockResolvedValue(alreadyNudged),
    notifyBuddy: jest.fn().mockResolvedValue(undefined),
  };
  const listener = new BuddyNotificationsListener(prisma as never, notifications as never);
  return { listener, notifications };
}

describe('BuddyNotificationsListener mood nudges', () => {
  it('nudges a wilting buddy with warm, non-guilt copy', async () => {
    const { listener, notifications } = createListener([
      { id: 'b1', userId: 'u1', name: 'Sprout', mood: BuddyMood.WILTING },
    ]);

    await listener.sendMoodNudges();

    expect(notifications.notifyBuddy).toHaveBeenCalledTimes(1);
    const [userId, title, body, kind] = notifications.notifyBuddy.mock.calls[0];
    expect(userId).toBe('u1');
    expect(kind).toBe('mood');
    expect(title).toBe('Sprout would love a little care');
    // Tone guardrail: no guilt-tripping copy.
    expect(title).not.toMatch(/misses you/i);
    expect(body).not.toMatch(/cheer up your buddy/i);
  });

  it('uses gentle resting copy for a dormant buddy', async () => {
    const { listener, notifications } = createListener([
      { id: 'b2', userId: 'u2', name: 'Sage', mood: BuddyMood.DORMANT },
    ]);

    await listener.sendMoodNudges();

    expect(notifications.notifyBuddy.mock.calls[0][1]).toBe('Sage is resting');
  });

  it('does not nudge a buddy that was already nudged today', async () => {
    const { listener, notifications } = createListener(
      [{ id: 'b3', userId: 'u3', name: 'Fernie', mood: BuddyMood.THIRSTY }],
      true,
    );

    await listener.sendMoodNudges();

    expect(notifications.notifyBuddy).not.toHaveBeenCalled();
  });
});
