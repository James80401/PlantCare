import { useState } from 'react';
import { Link } from 'react-router-dom';
import FriendCard from '../../../components/buddy/FriendCard';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useBuddy } from '../../../hooks/buddy/useBuddy';
import { useBuddySocial } from '../../../hooks/buddy/useBuddySocial';

export default function GardenTownPage() {
  const { buddy } = useBuddy();
  const { friends, feed, loading, error, shining, refresh, addFriend, sendSunshine } =
    useBuddySocial();
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAdd = async () => {
    if (!code.trim()) return;
    setAdding(true);
    setMessage('');
    try {
      const data = await addFriend(code.trim().toUpperCase());
      setMessage(data.message ?? 'Friend added!');
      setCode('');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
          : 'Could not add friend';
      setMessage(msg || 'Could not add friend');
    } finally {
      setAdding(false);
    }
  };

  const copyCode = async () => {
    if (!buddy?.gardenCode) return;
    await navigator.clipboard.writeText(buddy.gardenCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading Garden Town…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Plant Buddy"
        title="Garden Town"
        description="Visit friends, send sunshine, grow together"
      />

      {buddy && (
        <Card className="space-y-2">
          <p className="text-sm font-medium text-emerald-900">Your garden code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl bg-emerald-50 px-3 py-2 font-mono text-lg font-bold text-emerald-950">
              {buddy.gardenCode}
            </code>
            <Button type="button" size="sm" variant="secondary" onClick={copyCode}>
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">Share this code so friends can visit your garden.</p>
        </Card>
      )}

      <Card className="space-y-3">
        <p className="text-sm font-semibold text-emerald-900">Add a friend</p>
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono uppercase"
          placeholder="SPROUT-7X4K"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="button" fullWidth disabled={adding} onClick={handleAdd}>
          {adding ? 'Adding…' : 'Add friend'}
        </Button>
        {message && <p className="text-sm text-emerald-800">{message}</p>}
      </Card>

      {error && <p className="text-center text-sm text-red-700">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Friends</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-gray-500">No friends yet — add someone by garden code.</p>
        ) : (
          friends.map((f) => (
            <FriendCard
              key={f.friendshipId}
              friend={f}
              shining={shining === f.friendBuddyId}
              onShine={async (id) => {
                try {
                  const res = await sendSunshine(id);
                  setMessage(
                    res.newFriendshipLevel
                      ? `Sunshine sent! Friendship reached level ${res.newFriendshipLevel}.`
                      : 'Sunshine sent! +3 dewdrops each.',
                  );
                } catch (e: unknown) {
                  const msg =
                    e && typeof e === 'object' && 'response' in e
                      ? String(
                          (e as { response?: { data?: { message?: string } } }).response?.data
                            ?.message,
                        )
                      : 'Could not send sunshine';
                  setMessage(msg || 'Could not send sunshine');
                }
              }}
            />
          ))
        )}
      </section>

      {feed.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
            Activity feed
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {feed.slice(0, 10).map((item) => (
              <li key={item.id} className="rounded-xl bg-emerald-50/80 px-3 py-2">
                {item.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="ghost" fullWidth onClick={() => refresh()}>
          Refresh
        </Button>
        <Link
          to="/garden/buddy"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl text-sm font-medium text-emerald-800 hover:underline"
        >
          ← Buddy home
        </Link>
      </div>
    </div>
  );
}
