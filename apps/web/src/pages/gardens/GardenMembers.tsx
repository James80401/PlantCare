import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { PageHeader, Card, Button, Input, SkeletonGrid } from '../../components/ui';
import { FormError } from '../../components/a11y/FormError';
import { useAuth } from '../../context/AuthContext';
import { useGardenDetail } from '../../hooks/useGardenDetail';
import { gardensApi, type GardenInviteSummary } from '../../services/api';

/**
 * Garden Members / Sharing subsection. Owners can invite caretakers/viewers, see pending
 * invites, and remove members. Everyone can see who's in the garden. Per-plant sharing
 * (PlantShare) remains available on the Household page.
 */
export default function GardenMembers() {
  const { gardenId } = useParams<{ gardenId: string }>();
  const { user } = useAuth();
  const { garden, loading, error, reload } = useGardenDetail(gardenId);

  const [invites, setInvites] = useState<GardenInviteSummary[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'CAREGIVER' | 'VIEWER'>('CAREGIVER');
  const [lastToken, setLastToken] = useState('');
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadInvites = useCallback(async () => {
    if (!gardenId || !garden?.isOwner) return;
    try {
      const { data } = await gardensApi.listInvites(gardenId);
      setInvites(data);
    } catch {
      /* non-fatal */
    }
  }, [gardenId, garden?.isOwner]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!gardenId) return;
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      const { data } = await gardensApi.createInvite(gardenId, {
        email: inviteEmail.trim() || undefined,
        role: inviteRole,
      });
      setLastToken(data.token);
      setInviteEmail('');
      setMessage(
        data.emailSent
          ? 'Invite email sent. They can also use the token below.'
          : 'Invite created — share the token below.',
      );
      await loadInvites();
    } catch {
      setActionError('Could not create invite.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (memberUserId: string, label: string) => {
    if (!gardenId) return;
    if (!window.confirm(`Remove ${label} from this garden?`)) return;
    setActionError('');
    try {
      await gardensApi.removeMember(gardenId, memberUserId);
      await reload();
    } catch {
      setActionError('Could not remove that member.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Members" />
        <SkeletonGrid count={2} />
      </div>
    );
  }
  if (error || !garden) {
    return (
      <div className="space-y-4">
        <BackLink gardenId={gardenId} />
        <FormError>{error || 'Garden not found.'}</FormError>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink gardenId={gardenId} name={garden.name} />
      <PageHeader
        eyebrow={garden.name}
        title="Members & Sharing"
        description="Invite people to help care for this garden. Caretakers can complete tasks and update plants; viewers can only look."
      />

      {message ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {actionError ? <FormError>{actionError}</FormError> : null}

      {/* Members */}
      <Card padding="sm" className="space-y-3">
        <h2 className="font-semibold text-emerald-950">
          Members ({garden.members.length})
        </h2>
        <ul className="divide-y divide-emerald-50">
          {garden.members.map((m) => {
            const isSelf = m.userId === user?.id;
            const label = m.user?.name || m.user?.email || 'Member';
            return (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-emerald-950">
                    {label}
                    {isSelf ? ' (you)' : ''}
                  </p>
                  <p className="text-xs text-gray-500">{roleLabel(m.role)}</p>
                </div>
                {garden.isOwner && m.role !== 'OWNER' && !isSelf ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(m.userId, label)}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Owner: invite + pending invites */}
      {garden.isOwner ? (
        <>
          <Card padding="sm" className="space-y-3">
            <h2 className="font-semibold text-emerald-950">Invite someone</h2>
            <form onSubmit={handleInvite} className="space-y-3">
              <Input
                label="Email (optional — sends an invite email if configured)"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="partner@example.com"
              />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-emerald-900">Role</span>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'CAREGIVER' | 'VIEWER')}
                  className="rounded-2xl border border-emerald-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none"
                >
                  <option value="CAREGIVER">Caretaker — can complete tasks & update plants</option>
                  <option value="VIEWER">Viewer — can only look</option>
                </select>
              </label>
              <Button type="submit" disabled={busy} aria-busy={busy}>
                {busy ? 'Creating…' : 'Create invite'}
              </Button>
            </form>
            {lastToken ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
                <p className="font-medium text-emerald-900">Invite token</p>
                <code className="mt-1 block break-all rounded-lg bg-white px-2 py-1 text-xs text-emerald-800">
                  {lastToken}
                </code>
                <p className="mt-1 text-xs text-emerald-700">
                  Share this token — the invitee pastes it under “Join a garden”.
                </p>
              </div>
            ) : null}
          </Card>

          {invites.length > 0 ? (
            <Card padding="sm" className="space-y-2">
              <h2 className="font-semibold text-emerald-950">Pending invites ({invites.length})</h2>
              <ul className="divide-y divide-emerald-50">
                {invites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-emerald-950">
                        {inv.email || 'Anyone with the token'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {roleLabel(inv.role)} · expires {format(parseISO(inv.expiresAt), 'MMM d')}
                      </p>
                    </div>
                    <code className="shrink-0 rounded bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800">
                      {inv.token.slice(0, 8)}…
                    </code>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      ) : (
        <Card padding="sm">
          <p className="text-sm text-gray-600">
            Only the garden owner can invite or remove members.
          </p>
        </Card>
      )}

      <p className="text-sm text-gray-500">
        Want to share a single plant across gardens instead?{' '}
        <Link to="/garden/household" className="font-medium text-emerald-700 hover:underline">
          Per-plant sharing
        </Link>
        .
      </p>
    </div>
  );
}

function roleLabel(role: string): string {
  if (role === 'OWNER') return 'Owner';
  if (role === 'CAREGIVER') return 'Caretaker';
  if (role === 'VIEWER') return 'Viewer';
  return role;
}

function BackLink({ gardenId, name }: { gardenId?: string; name?: string }) {
  return (
    <Link
      to={`/garden/gardens/${gardenId ?? ''}`}
      className="text-sm font-medium text-emerald-700 hover:underline"
    >
      ← {name ?? 'Garden'}
    </Link>
  );
}
