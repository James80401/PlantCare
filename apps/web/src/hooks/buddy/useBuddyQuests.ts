import { useCallback, useEffect, useState } from 'react';
import { buddyApi } from '../../services/api';
import type { QuestCardData } from '../../components/buddy/QuestCard';
import { formatApiErrorMessage } from '../../utils/apiError';

export interface MonthlyChallengeView {
  challengeId: string;
  title: string;
  description: string;
  stepsCompleted: number;
  totalSteps: number;
  rewardDewdrops: number;
  completed: boolean;
  nextStep: { label: string; index: number } | null;
}

export interface BuddyQuestsResponse {
  daily: QuestCardData[];
  achievements: QuestCardData[];
  monthly: MonthlyChallengeView | null;
  dewdrops: number;
}

export function useBuddyQuests() {
  const [data, setData] = useState<BuddyQuestsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await buddyApi.getQuests();
      setData(res);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Failed to load quests'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const claim = async (questId: string) => {
    setClaiming(true);
    try {
      const { data: result } = await buddyApi.claimQuest(questId);
      await refresh();
      return result as { dewdropsAwarded: number; dewdrops: number };
    } finally {
      setClaiming(false);
    }
  };

  return { data, loading, error, claiming, claim, refresh };
}
