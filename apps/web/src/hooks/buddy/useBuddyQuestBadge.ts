import { useCallback, useEffect, useState } from 'react';
import { buddyApi } from '../../services/api';
import { useInterval } from '../useInterval';

/** Count of daily/achievement quests ready to claim (for nav badge). */
export function useBuddyQuestBadge(enabled = true) {
  const [claimable, setClaimable] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const { data } = await buddyApi.getQuests();
      const daily = data.daily ?? [];
      const achievements = data.achievements ?? [];
      const count = [...daily, ...achievements].filter(
        (q) => q.completed && !q.rewardClaimed,
      ).length;
      setClaimable(count);
    } catch {
      setClaimable(0);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useInterval(refresh, 60_000, enabled);

  return claimable;
}
