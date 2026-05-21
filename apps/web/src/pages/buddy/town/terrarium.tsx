import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BuddySprite from '../../../components/buddy/BuddySprite';
import TerrariumView from '../../../components/buddy/TerrariumView';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { GROWTH_STAGE_LABEL } from '../../../components/buddy/species';
import { buddyApi } from '../../../services/api';
import { useBuddySocial } from '../../../hooks/buddy/useBuddySocial';

export default function FriendTerrariumPage() {
  const { friendBuddyId } = useParams<{ friendBuddyId: string }>();
  const { removeFriend } = useBuddySocial();
  const [data, setData] = useState<Awaited<ReturnType<typeof buddyApi.viewFriendTerrarium>>['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [shining, setShining] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    if (!friendBuddyId) return;
    setLoading(true);
    buddyApi
      .viewFriendTerrarium(friendBuddyId)
      .then(({ data: res }) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, [friendBuddyId]);

  const shine = async () => {
    if (!friendBuddyId) return;
    setShining(true);
    setMessage('');
    try {
      await buddyApi.sendSunshine(friendBuddyId);
      setMessage('Sunshine sent!');
      load();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
          : 'Could not send';
      setMessage(msg || 'Could not send');
    } finally {
      setShining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg text-center text-red-700">
        Could not load terrarium
        <Link to="/garden/buddy/town" className="mt-4 block text-emerald-800">
          ← Garden Town
        </Link>
      </div>
    );
  }

  const b = data.buddy;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Visit"
        title={b.name}
        description={data.ownerName ? `${data.ownerName}'s garden` : 'Friend garden'}
      />

      <Card className="flex flex-col items-center gap-3 py-6">
        <BuddySprite speciesId={b.speciesId} size="lg" />
        <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-900">
          {GROWTH_STAGE_LABEL[b.growthStage] ?? b.growthStage}
        </span>
      </Card>

      <TerrariumView
        backgroundKey={b.terrariumBackground}
        layout={b.terrariumLayout as Record<string, unknown>}
        furniture={[]}
      />

      {data.canSendSunshine ? (
        <Button type="button" fullWidth disabled={shining} onClick={shine}>
          {shining ? 'Sending…' : '☀️ Send sunshine'}
        </Button>
      ) : (
        <p className="text-center text-sm text-gray-500">Sunshine already sent today</p>
      )}
      {message && <p className="text-center text-sm text-emerald-800">{message}</p>}

      <Button
        type="button"
        variant="ghost"
        fullWidth
        className="text-red-800"
        onClick={async () => {
          if (!friendBuddyId || !window.confirm('Remove this friend?')) return;
          await removeFriend(friendBuddyId);
          window.location.href = '/garden/buddy/town';
        }}
      >
        Remove friend
      </Button>

      <Link
        to="/garden/buddy/town"
        className="block text-center text-sm font-medium text-emerald-800 hover:underline"
      >
        ← Garden Town
      </Link>
    </div>
  );
}
