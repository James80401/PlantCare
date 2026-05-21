import { useCallback, useEffect, useState } from 'react';
import type { FriendCardData } from '../../components/buddy/FriendCard';
import { buddyApi } from '../../services/api';

export function useBuddySocial() {
  const [friends, setFriends] = useState<FriendCardData[]>([]);
  const [feed, setFeed] = useState<{ id: string; type: string; sentAt: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shining, setShining] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [f, feedRes] = await Promise.all([
        buddyApi.listFriends(),
        buddyApi.socialFeed(),
      ]);
      setFriends(f.data);
      setFeed(feedRes.data);
    } catch {
      setError('Could not load Garden Town');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addFriend = async (gardenCode: string) => {
    const res = await buddyApi.addFriend(gardenCode);
    await refresh();
    return res.data as { message?: string };
  };

  const removeFriend = async (friendBuddyId: string) => {
    await buddyApi.removeFriend(friendBuddyId);
    await refresh();
  };

  const sendSunshine = async (friendBuddyId: string) => {
    setShining(friendBuddyId);
    try {
      const { data } = await buddyApi.sendSunshine(friendBuddyId);
      await refresh();
      return data;
    } finally {
      setShining(null);
    }
  };

  return {
    friends,
    feed,
    loading,
    error,
    shining,
    refresh,
    addFriend,
    removeFriend,
    sendSunshine,
  };
}
