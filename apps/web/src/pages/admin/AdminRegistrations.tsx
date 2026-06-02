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

type AdminAuditSummary = {
  retentionDays: number;
  total: number;
  failures: number;
  latest?: {
    createdAt: string;
    actorEmail?: string | null;
    action: string;
    outcome: 'SUCCESS' | 'ERROR';
  } | null;
  byAction: { action: string; count: number }[];
};

type AdminAuditLog = {
  id: string;
  actorEmail?: string | null;
  action: string;
  method: string;
  path: string;
  targetUserId?: string | null;
  requestId?: string | null;
  statusCode: number;
  outcome: 'SUCCESS' | 'ERROR';
  durationMs: number;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
};

export default function AdminRegistrations() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [auditSummary, setAuditSummary] = useState<AdminAuditSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: me } = await usersApi.me();
    setIsAdmin(Boolean(me.isAdmin));
    if (!me.isAdmin) return;
    const [usersRes, summaryRes, logsRes] = await Promise.all([
      adminApi.listUsers(),
      adminApi.auditSummary(),
      adminApi.auditLogs(75),
    ]);
    setUsers(usersRes.data);
    setAuditSummary(summaryRes.data);
    setAuditLogs(logsRes.data);
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

  const unpauseAi = async (userId: string) => {
    setBusyId(userId);
    setError('');
    try {
      await adminApi.unpauseAi(userId);
      await load();
    } catch {
      setError('AI unpause failed.');
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
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">Admin control center</h1>
            <p className="mt-1 text-sm text-emerald-900/70">
              Approve accounts, control access, and review 30 days of admin actions.
            </p>
          </div>
          <Link to="/garden" className="text-sm font-medium text-emerald-800 hover:underline">
            Back to app
          </Link>
        </div>
        {error ? <p className="text-sm text-rose-600" role="alert">{error}</p> : null}
        {auditSummary ? (
          <section className="rounded-lg bg-white p-4 shadow-sm" aria-labelledby="audit-summary-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="audit-summary-heading" className="text-lg font-semibold text-gray-900">
                  Admin audit log
                </h2>
                <p className="text-sm text-gray-600">
                  Durable admin action history retained for {auditSummary.retentionDays} days.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => load()}>
                Refresh
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <AdminMetric label="30-day actions" value={auditSummary.total} />
              <AdminMetric label="Failures" value={auditSummary.failures} />
              <AdminMetric
                label="Action types"
                value={auditSummary.byAction.length}
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {auditSummary.latest
                    ? new Date(auditSummary.latest.createdAt).toLocaleString()
                    : 'None'}
                </p>
                <p className="text-xs text-gray-600">Latest action</p>
              </div>
            </div>
            {auditSummary.byAction.length ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {auditSummary.byAction.map((item) => (
                  <span key={item.action} className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-900">
                    {item.action}: {item.count}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
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
                    {isAiPaused(u.aiPausedUntil) ? (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busyId === u.id}
                        onClick={() => unpauseAi(u.id)}
                      >
                        Unpause AI
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
        <section className="rounded-lg bg-white p-4 shadow-sm" aria-labelledby="audit-log-heading">
          <h2 id="audit-log-heading" className="text-lg font-semibold text-gray-900">
            Recent admin actions
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Showing the latest {auditLogs.length} entries from the retained 30-day audit trail.
          </p>
          {auditLogs.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No admin actions logged yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-2 py-2 font-semibold">Time</th>
                    <th className="px-2 py-2 font-semibold">Admin</th>
                    <th className="px-2 py-2 font-semibold">Action</th>
                    <th className="px-2 py-2 font-semibold">Result</th>
                    <th className="px-2 py-2 font-semibold">Target</th>
                    <th className="px-2 py-2 font-semibold">Request</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-2 py-2 text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-2 py-2 text-gray-900">{log.actorEmail ?? 'Unknown'}</td>
                      <td className="px-2 py-2">
                        <p className="font-semibold text-gray-900">{log.action}</p>
                        <p className="max-w-[18rem] truncate text-gray-500" title={log.path}>
                          {log.method} {log.path}
                        </p>
                      </td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-1 font-semibold ${log.outcome === 'SUCCESS' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                          {log.statusCode} {log.outcome.toLowerCase()}
                        </span>
                        <p className="mt-1 text-gray-500">{log.durationMs} ms</p>
                      </td>
                      <td className="px-2 py-2 text-gray-600">{shortId(log.targetUserId)}</td>
                      <td className="px-2 py-2 text-gray-600">
                        <p>{shortId(log.requestId)}</p>
                        {log.ip ? <p>{log.ip}</p> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
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

function shortId(value?: string | null) {
  if (!value) return '-';
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}
