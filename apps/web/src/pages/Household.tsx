import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { gardensApi, plantsApi, type ActivityEventSummary, type GardenSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatActivityLabel } from '../utils/household';
import { CreateGardenForm } from '../components/gardens/CreateGardenForm';
import { formatApiErrorMessage } from '../utils/apiError';

export default function Household() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [gardens, setGardens] = useState<GardenSummary[]>([]);
  const [myPlants, setMyPlants] = useState<Array<{ id: string; nickname?: string | null; species: { commonName: string } }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inviteGardenId, setInviteGardenId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'CAREGIVER' | 'VIEWER'>('CAREGIVER');
  const [lastInviteToken, setLastInviteToken] = useState('');
  const [shareGardenId, setShareGardenId] = useState<string | null>(null);
  const [sharePlantId, setSharePlantId] = useState('');
  const [shareCanComplete, setShareCanComplete] = useState(true);
  const [shareCanJournal, setShareCanJournal] = useState(true);
  const [activity, setActivity] = useState<ActivityEventSummary[]>([]);
  const [acceptToken, setAcceptToken] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [gardenRes, plantRes] = await Promise.all([gardensApi.mine(), plantsApi.list()]);
      setGardens(gardenRes.data);
      setMyPlants(plantRes.data);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not load households.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadActivity = async (gardenId: string) => {
    const { data } = await gardensApi.activity(gardenId);
    setActivity(data);
  };

  const handleInvite = async (e: FormEvent, gardenId: string) => {
    e.preventDefault();
    if (!gardenId) return;
    setMessage('');
    try {
      const { data } = await gardensApi.createInvite(gardenId, {
        email: inviteEmail.trim() || undefined,
        role: inviteRole,
      });
      setLastInviteToken(data.token);
      setInviteGardenId(gardenId);
      setInviteEmail('');
      setMessage(
        data.emailSent
          ? 'Invite email sent. They can also use the link or token below.'
          : inviteEmail.trim()
            ? 'Invite created — email was not sent (SMTP may be off). Share the link or token below.'
            : 'Invite created — share the link or token below.',
      );
      await load();
    } catch (err) {
      setMessage(formatApiErrorMessage(err, 'Could not create invite.'));
    }
  };

  const handleSharePlant = async (e: FormEvent) => {
    e.preventDefault();
    if (!shareGardenId || !sharePlantId) return;
    setMessage('');
    try {
      await gardensApi.sharePlant(shareGardenId, {
        plantId: sharePlantId,
        canComplete: shareCanComplete,
        canJournal: shareCanJournal,
      });
      setSharePlantId('');
      setShareCanComplete(true);
      setShareCanJournal(true);
      setMessage('Plant shared with household.');
      await load();
    } catch (err) {
      setMessage(formatApiErrorMessage(err, 'Could not share plant.'));
    }
  };

  const handleAcceptInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!acceptToken.trim()) return;
    setMessage('');
    try {
      await gardensApi.acceptInvite(acceptToken.trim());
      setAcceptToken('');
      setMessage('Invite accepted — welcome to the household.');
      await load();
    } catch (err) {
      setMessage(formatApiErrorMessage(err, 'Could not accept invite. Check the token and expiry.'));
    }
  };

  const ownedGardens = gardens.filter((g) => g.ownerId === user?.id);

  return (
    <div>
      <PageHeader
        eyebrow="Care Share"
        title="Household"
        description="Invite family or roommates to help with shared plants. Caregivers can complete tasks you assign."
        help="household"
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      <Card className="space-y-3">
        <h2 className="font-semibold text-emerald-950">Join with invite</h2>
        <form onSubmit={handleAcceptInvite} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={acceptToken}
            onChange={(e) => setAcceptToken(e.target.value)}
            placeholder="Paste invite token"
            className="min-w-0 flex-1 rounded-2xl border border-emerald-100 px-3 py-2 text-sm"
          />
          <Button type="submit">Accept</Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-emerald-950">Create household</h2>
        <CreateGardenForm
          submitLabel="Create household"
          onCreated={async () => {
            setMessage('Household created.');
            await load();
          }}
        />
      </Card>

      {loading ? (
        <p className="text-sm text-gray-500">Loading households…</p>
      ) : ownedGardens.length === 0 ? (
        <p className="text-sm text-gray-600">
          You have not created a household yet. Create one to share plants and send invites.
        </p>
      ) : (
        <ul className="space-y-4">
          {ownedGardens.map((garden) => (
            <li key={garden.id}>
              <Card className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-emerald-950">{garden.name}</h2>
                    <p className="text-xs text-gray-500">
                      {garden.members.length} member{garden.members.length === 1 ? '' : 's'} ·{' '}
                      {garden.plants.length} shared plant{garden.plants.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadActivity(garden.id)}
                    className="text-sm font-semibold text-emerald-800 hover:underline"
                  >
                    View activity
                  </button>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Members
                  </p>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    {garden.members.map((member) => (
                      <li key={member.id}>
                        {member.user?.name || member.user?.email || member.userId} ·{' '}
                        <span className="font-medium">{member.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {garden.plants.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Shared plants
                    </p>
                    <ul className="mt-1 space-y-1 text-sm">
                      {garden.plants.map((share) => (
                        <li key={share.id}>
                          <Link
                            to={`/garden/plants/${share.plant.id}`}
                            className="font-medium text-emerald-800 hover:underline"
                          >
                            {share.plant.nickname || share.plant.species.commonName}
                          </Link>
                          <span className="ml-2 text-xs text-gray-500">
                            {[
                              share.canComplete ? 'can complete tasks' : null,
                              share.canJournal ? 'can journal' : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'view only'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShareGardenId(garden.id);
                    handleSharePlant(e);
                  }}
                  className="space-y-2 rounded-2xl bg-emerald-50/60 p-3"
                >
                  <p className="text-sm font-medium text-emerald-900">Share a plant</p>
                  <select
                    value={shareGardenId === garden.id ? sharePlantId : ''}
                    onChange={(e) => {
                      setShareGardenId(garden.id);
                      setSharePlantId(e.target.value);
                    }}
                    className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
                  >
                    <option value="">Select your plant…</option>
                    {myPlants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.nickname || plant.species.commonName}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={shareCanComplete}
                      onChange={(e) => setShareCanComplete(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-200 text-emerald-700"
                    />
                    Allow caregivers to complete tasks
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={shareCanJournal}
                      onChange={(e) => setShareCanJournal(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-200 text-emerald-700"
                    />
                    Allow caregivers to add journal entries
                  </label>
                  <Button type="submit" variant="secondary" fullWidth disabled={!sharePlantId}>
                    Share to household
                  </Button>
                </form>

                <form
                  onSubmit={(e) => handleInvite(e, garden.id)}
                  className="space-y-2 rounded-2xl border border-emerald-100 p-3"
                >
                  <p className="text-sm font-medium text-emerald-900">Invite someone</p>
                  <input
                    type="email"
                    value={inviteGardenId === garden.id ? inviteEmail : ''}
                    onChange={(e) => {
                      setInviteGardenId(garden.id);
                      setInviteEmail(e.target.value);
                    }}
                    placeholder="Email (optional)"
                    className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
                  />
                  <select
                    value={inviteGardenId === garden.id ? inviteRole : 'CAREGIVER'}
                    onChange={(e) => {
                      setInviteGardenId(garden.id);
                      setInviteRole(e.target.value as 'CAREGIVER' | 'VIEWER');
                    }}
                    className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
                  >
                    <option value="CAREGIVER">Caregiver — can complete shared tasks</option>
                    <option value="VIEWER">Viewer — read only</option>
                  </select>
                  <Button type="submit" variant="secondary" fullWidth>
                    Create invite
                  </Button>
                </form>

                {inviteGardenId === garden.id && lastInviteToken ? (
                  <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                    <p>
                      Invite link:{' '}
                      <a
                        href={`${window.location.origin}/garden/household?invite=${encodeURIComponent(lastInviteToken)}`}
                        className="font-medium text-emerald-800 break-all hover:underline"
                      >
                        Open invite
                      </a>
                    </p>
                    <p className="break-all">
                      Or paste token: <strong>{lastInviteToken}</strong>
                    </p>
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {activity.length > 0 ? (
        <Card className="space-y-3">
          <h2 className="font-semibold text-emerald-950">Recent activity</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {activity.map((event) => (
              <li key={event.id} className="flex flex-wrap gap-2 border-b border-emerald-50 pb-2">
                <span className="font-medium text-emerald-900">
                  {event.actor?.name || event.actor?.email || 'Someone'}
                </span>
                <span>{formatActivityLabel(event.type, event.payload)}</span>
                <span className="text-xs text-gray-400">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
