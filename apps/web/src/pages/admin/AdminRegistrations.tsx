import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { adminApi, usersApi } from '../../services/api';

type ManagedUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  accountApprovalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  planTier: 'FREE' | 'PREMIUM';
  aiPausedUntil?: string | null;
  createdAt: string;
  isAdmin?: boolean;
  _count?: { plants: number };
  subscriptions?: { status: string; planName: string; createdAt: string }[];
  aiUsage?: {
    totalCalls: number;
    lastHourCalls: number;
    last24HourCalls: number;
    offTopicBlocks: number;
    rateLimitBlocks: number;
    latest?: {
      createdAt: string;
      status: string;
      feature: string;
      reason?: string | null;
    } | null;
  };
};

export default function AdminRegistrations() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: me } = await usersApi.me();
    setIsAdmin(Boolean(me.isAdmin));
    if (!me.isAdmin) return;
    const { data } = await adminApi.listUsers();
    setUsers(data);
  }, []);

  useEffect(() => {
    load().catch(() => {
      setIsAdmin(false);
      setError('Could not load admin data.');
    });
  }, [load]);

  const approve = async (userId: string) => {
    setBusyId(userId);
    setError('');
    try {
      await adminApi.approve(userId);
      await load();
    } catch {
      setError('Approve failed.');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (userId: string) => {
    setBusyId(userId);
    setError('');
    try {
      await adminApi.reject(userId);
      await load();
    } catch {
      setError('Reject failed.');
    } finally {
      setBusyId(null);
    }
  };

  const disable = async (userId: string) => {
    setBusyId(userId);
    setError('');
    try {
      await adminApi.disable(userId);
      await load();
    } catch {
      setError('Disable failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/garden" replace />;
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Account access</h1>
            <p className="mt-1 text-sm text-emerald-900/70">
              Approve verified registrations or disable access for existing accounts.
            </p>
          </div>
          <Link to="/garden" className="text-sm font-medium text-emerald-800 hover:underline">
            Back to app
          </Link>
        </div>
        {error ? <p className="text-sm text-rose-600" role="alert">{error}</p> : null}
        {users.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600 shadow-sm">No accounts found.</p>
        ) : (
          <ul className="space-y-3">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.email}</p>
                    {u.name ? <p className="text-sm text-gray-600">{u.name}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className={`rounded-full px-2 py-1 font-semibold ${statusClass(u.accountApprovalStatus)}`}>
                        {statusLabel(u.accountApprovalStatus)}
                      </span>
                      <span className={`rounded-full px-2 py-1 font-semibold ${u.emailVerified ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                        {u.emailVerified ? 'Email verified' : 'Email not verified'}
                      </span>
                      {u.isAdmin ? (
                        <span className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-800">
                          Admin
                        </span>
                      ) : null}
                      <span className={`rounded-full px-2 py-1 font-semibold ${u.planTier === 'PREMIUM' ? 'bg-violet-50 text-violet-800' : 'bg-gray-100 text-gray-700'}`}>
                        {u.planTier === 'PREMIUM' ? 'Premium' : 'Free'}
                      </span>
                      {u.subscriptions?.[0] ? (
                        <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-800">
                          {u.subscriptions[0].status.toLowerCase()}
                        </span>
                      ) : null}
                      {isAiPaused(u.aiPausedUntil) ? (
                        <span className="rounded-full bg-rose-100 px-2 py-1 font-semibold text-rose-900">
                          AI paused
                        </span>
                      ) : null}
                      <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                        {u._count?.plants ?? 0} plants
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Registered {new Date(u.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {u.accountApprovalStatus !== 'APPROVED' ? (
                      <Button
                        type="button"
                        disabled={busyId === u.id || !u.emailVerified}
                        onClick={() => approve(u.id)}
                      >
                        {u.accountApprovalStatus === 'REJECTED' ? 'Enable' : 'Approve'}
                      </Button>
                    ) : null}
                    {u.accountApprovalStatus === 'PENDING' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busyId === u.id || Boolean(u.isAdmin)}
                        onClick={() => reject(u.id)}
                      >
                        Reject
                      </Button>
                    ) : null}
                    {u.accountApprovalStatus === 'APPROVED' ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busyId === u.id || Boolean(u.isAdmin)}
                        onClick={() => disable(u.id)}
                      >
                        Disable
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600 sm:grid-cols-5">
                  <AdminMetric label="AI calls total" value={u.aiUsage?.totalCalls ?? 0} />
                  <AdminMetric label="Last hour" value={u.aiUsage?.lastHourCalls ?? 0} />
                  <AdminMetric label="Last 24h" value={u.aiUsage?.last24HourCalls ?? 0} />
                  <AdminMetric label="Off-topic blocks" value={u.aiUsage?.offTopicBlocks ?? 0} />
                  <AdminMetric label="Rate blocks" value={u.aiUsage?.rateLimitBlocks ?? 0} />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {u.aiPausedUntil && isAiPaused(u.aiPausedUntil)
                    ? `Dr. Plant paused until ${new Date(u.aiPausedUntil).toLocaleString()}`
                    : u.aiUsage?.latest
                      ? `Latest AI event: ${u.aiUsage.latest.status.toLowerCase()} on ${u.aiUsage.latest.feature.replace('_', ' ')} at ${new Date(u.aiUsage.latest.createdAt).toLocaleString()}`
                      : 'No AI usage yet'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AdminMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-semibold text-gray-900">{value}</p>
      <p>{label}</p>
    </div>
  );
}

function isAiPaused(value?: string | null) {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

function statusLabel(status: ManagedUser['accountApprovalStatus']) {
  if (status === 'APPROVED') return 'Access enabled';
  if (status === 'REJECTED') return 'Access disabled';
  return 'Awaiting approval';
}

function statusClass(status: ManagedUser['accountApprovalStatus']) {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-900';
  if (status === 'REJECTED') return 'bg-rose-100 text-rose-900';
  return 'bg-amber-100 text-amber-900';
}
