import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { adminApi, usersApi } from '../../services/api';
import type { BuddyState } from '../../hooks/buddy/types';
import type { ShopItem, ShopItemCategory } from '../../hooks/buddy/shopTypes';
import { formatApiErrorMessage } from '../../utils/apiError';

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

type AdminObservability = {
  generatedAt: string;
  users: {
    total: number;
    approved: number;
    pending: number;
    disabled: number;
    verified: number;
    admins: number;
    new24h: number;
    new30d: number;
    withPlants: number;
  };
  ai: {
    last24h: AdminAiWindow;
    last30d: AdminAiWindow;
    pausedUsers: { id: string; email: string; name?: string | null; aiPausedUntil: string }[];
    topUsers: {
      userId: string;
      email: string;
      name?: string | null;
      calls: number;
      promptChars: number;
      imageCount: number;
      plants: number;
    }[];
    latestEvents: {
      id: string;
      feature: string;
      status: string;
      reason?: string | null;
      promptChars: number;
      imageCount: number;
      createdAt: string;
      user?: { email: string; name?: string | null } | null;
    }[];
  };
  notifications: {
    activeDeviceTokens: number;
    last30d: { channel: string; status: string; count: number }[];
  };
  audit: {
    last30d: number;
    failures30d: number;
    latestActions: {
      id: string;
      actorEmail?: string | null;
      action: string;
      outcome: 'SUCCESS' | 'ERROR';
      statusCode: number;
      durationMs: number;
      createdAt: string;
    }[];
  };
};

type AdminAiWindow = {
  total: number;
  allowed: number;
  blocked: number;
  promptChars: number;
  imageCount: number;
  byStatus: { status: string; count: number; promptChars: number; imageCount: number }[];
};

type AdminBuddyOverview = {
  maxLevel: number;
  catalog: AdminBuddyItem[];
  buddies: AdminBuddyRow[];
};

type AdminBuddyItem = ShopItem & { levelRequired: number };

type AdminBuddyRow = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    accountApprovalStatus: string;
  };
  buddy: BuddyState;
  inventory: {
    itemId: string;
    acquiredAt: string;
    acquireMethod: string;
    item: AdminBuddyItem;
  }[];
};

type ExternalSourceStatus = 'user_confirmed' | 'reviewed' | 'curated';
type ExternalSpeciesFilter = 'all' | ExternalSourceStatus;
type PhotoReviewStatus = 'unreviewed' | 'approved' | 'needs_better_image';

type AdminExternalSpeciesReview = {
  generatedAt: string;
  totals: {
    total: number;
    userConfirmed: number;
    reviewed: number;
    curated: number;
    needsReview: number;
  };
  items: AdminExternalSpeciesRow[];
};

type AdminExternalSpeciesRow = {
  id: string;
  commonName: string;
  scientificName?: string | null;
  sunlight?: string | null;
  wateringFreqDays: number;
  toxicity?: string | null;
  careNotes?: string | null;
  defaultImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  externalSource: {
    provider: string;
    providerMatchId?: string;
    confidence?: number;
    confirmedAt?: string;
    confirmedBy?: 'user';
    status: ExternalSourceStatus;
    reviewedAt?: string;
    curatedAt?: string;
    reviewNote?: string;
    sourceNote?: string;
    photoReviewStatus?: PhotoReviewStatus;
    photoReviewNote?: string;
  };
};

type ExternalSpeciesDraft = {
  sunlight: string;
  wateringFreqDays: string;
  toxicity: string;
  careNotes: string;
  defaultImageUrl: string;
  reviewNote: string;
  sourceNote: string;
  photoReviewStatus: PhotoReviewStatus;
  photoReviewNote: string;
};

const SHOP_CATEGORY_ORDER: ShopItemCategory[] = [
  'POT_SKIN',
  'BACKGROUND',
  'FURNITURE',
  'HAT',
  'TOP',
  'GLASSES',
  'HELD_ITEM',
  'BODY_COLOR',
  'BODY_PATTERN',
  'SHOES',
  'COMPANION',
  'WINGS',
];

export default function AdminRegistrations() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [observability, setObservability] = useState<AdminObservability | null>(null);
  const [buddyOverview, setBuddyOverview] = useState<AdminBuddyOverview | null>(null);
  const [externalSpecies, setExternalSpecies] = useState<AdminExternalSpeciesReview | null>(null);
  const [auditSummary, setAuditSummary] = useState<AdminAuditSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [buddyLevelDrafts, setBuddyLevelDrafts] = useState<Record<string, string>>({});
  const [externalSpeciesDrafts, setExternalSpeciesDrafts] = useState<Record<string, ExternalSpeciesDraft>>({});
  const [externalSpeciesFilter, setExternalSpeciesFilter] = useState<ExternalSpeciesFilter>('all');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const pendingUsers = useMemo(
    () => users.filter((u) => u.accountApprovalStatus === 'PENDING'),
    [users],
  );
  const disabledUsers = useMemo(
    () => users.filter((u) => u.accountApprovalStatus === 'REJECTED'),
    [users],
  );
  const pausedAiUsers = useMemo(
    () => users.filter((u) => isAiPaused(u.aiPausedUntil)),
    [users],
  );
  const visibleExternalSpecies = useMemo(() => {
    const items = externalSpecies?.items ?? [];
    if (externalSpeciesFilter === 'all') return items;
    return items.filter((species) => species.externalSource.status === externalSpeciesFilter);
  }, [externalSpecies, externalSpeciesFilter]);

  const load = useCallback(async () => {
    const { data: me } = await usersApi.me();
    setIsAdmin(Boolean(me.isAdmin));
    if (!me.isAdmin) return;
    const [usersRes, summaryRes, logsRes, observabilityRes, buddyRes, speciesRes] = await Promise.all([
      adminApi.listUsers(),
      adminApi.auditSummary(),
      adminApi.auditLogs(75),
      adminApi.observability(),
      adminApi.buddyOverview(),
      adminApi.externalSpecies(),
    ]);
    setUsers(usersRes.data);
    setAuditSummary(summaryRes.data);
    setAuditLogs(logsRes.data);
    setObservability(observabilityRes.data);
    setBuddyOverview(buddyRes.data);
    setExternalSpecies(speciesRes.data);
    setExternalSpeciesDrafts((current) => {
      const next = { ...current };
      for (const species of speciesRes.data.items as AdminExternalSpeciesRow[]) {
        if (!next[species.id]) next[species.id] = externalSpeciesDraftFromRow(species);
      }
      return next;
    });
    setBuddyLevelDrafts((current) => {
      const next = { ...current };
      for (const row of buddyRes.data.buddies) {
        if (next[row.buddy.id] === undefined) next[row.buddy.id] = String(row.buddy.level);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    load().catch((err) => {
      setIsAdmin(false);
      setError(formatApiErrorMessage(err, 'Could not load admin data.'));
    });
  }, [load]);

  const approve = async (userId: string) => {
    setBusyId(userId);
    setError('');
    try {
      await adminApi.approve(userId);
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Approve failed.'));
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
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Reject failed.'));
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
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Disable failed.'));
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
    } catch (err) {
      setError(formatApiErrorMessage(err, 'AI unpause failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const setBuddyLevel = async (buddyId: string, rawLevel?: string) => {
    const maxLevel = buddyOverview?.maxLevel ?? 15;
    const parsed = Number(rawLevel ?? buddyLevelDrafts[buddyId]);
    const level = Math.max(1, Math.min(maxLevel, Number.isFinite(parsed) ? Math.round(parsed) : 1));
    setBusyId(`buddy-level-${buddyId}`);
    setError('');
    try {
      await adminApi.setBuddyLevel(buddyId, level);
      setBuddyLevelDrafts((drafts) => ({ ...drafts, [buddyId]: String(level) }));
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Buddy level update failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const toggleBuddyItem = async (buddyId: string, itemId: string, owned: boolean) => {
    setBusyId(`buddy-item-${buddyId}-${itemId}`);
    setError('');
    try {
      if (owned) await adminApi.lockBuddyItem(buddyId, itemId);
      else await adminApi.unlockBuddyItem(buddyId, itemId);
      await load();
    } catch (err) {
      setError(
        formatApiErrorMessage(err, owned ? 'Buddy item lock failed.' : 'Buddy item unlock failed.'),
      );
    } finally {
      setBusyId(null);
    }
  };

  const reviewExternalSpecies = async (speciesId: string, status: 'reviewed' | 'curated') => {
    const label = status === 'curated' ? 'curated' : 'reviewed';
    if (!window.confirm(`Mark this external species as ${label}? Save review edits first if you changed fields.`)) {
      return;
    }
    setBusyId(`species-${status}-${speciesId}`);
    setError('');
    try {
      await adminApi.reviewExternalSpecies(speciesId, {
        status,
        reviewNote: externalSpeciesDrafts[speciesId]?.reviewNote.trim() || undefined,
      });
      await load();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'External species review update failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const updateExternalSpeciesDraft = (
    speciesId: string,
    patch: Partial<ExternalSpeciesDraft>,
  ) => {
    setExternalSpeciesDrafts((drafts) => ({
      ...drafts,
      [speciesId]: {
        ...(drafts[speciesId] ?? emptyExternalSpeciesDraft()),
        ...patch,
      },
    }));
  };

  const saveExternalSpeciesDraft = async (speciesId: string) => {
    const draft = externalSpeciesDrafts[speciesId];
    if (!draft) return;
    const wateringFreqDays = Number(draft.wateringFreqDays);
    setBusyId(`species-save-${speciesId}`);
    setError('');
    try {
      await adminApi.reviewExternalSpecies(speciesId, {
        sunlight: textOrUndefined(draft.sunlight),
        wateringFreqDays: Number.isFinite(wateringFreqDays) ? Math.round(wateringFreqDays) : undefined,
        toxicity: textOrUndefined(draft.toxicity),
        careNotes: textOrUndefined(draft.careNotes),
        defaultImageUrl: textOrUndefined(draft.defaultImageUrl),
        reviewNote: textOrUndefined(draft.reviewNote),
        sourceNote: textOrUndefined(draft.sourceNote),
        photoReviewStatus: draft.photoReviewStatus,
        photoReviewNote: textOrUndefined(draft.photoReviewNote),
      });
      await load();
    } catch {
      setError('External species edits failed.');
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
            <h1 className="text-2xl font-bold text-emerald-900">Admin dashboard</h1>
            <p className="mt-1 text-sm text-emerald-900/70">
              Jump into approvals, access controls, AI usage, delivery health, and the 30-day audit trail.
            </p>
          </div>
          <Link to="/garden" className="text-sm font-medium text-emerald-800 hover:underline">
            Back to app
          </Link>
        </div>
        {error ? <p className="text-sm text-rose-600" role="alert">{error}</p> : null}
        <AdminSectionLinks
          items={[
            {
              href: '#overview',
              title: 'Overview',
              description: 'User, AI, notification, and audit health.',
              metric: observability ? String(observability.users.total) : '-',
              metricLabel: 'users',
            },
            {
              href: '#accounts',
              title: 'Accounts',
              description: 'Approve, disable, and unpause user access.',
              metric: String(pendingUsers.length),
              metricLabel: 'pending',
            },
            {
              href: '#ai-usage',
              title: 'AI usage',
              description: 'Call volume, blocked requests, and paused users.',
              metric: observability ? String(observability.ai.last24h.total) : '-',
              metricLabel: '24h calls',
            },
            {
              href: '#notifications',
              title: 'Notifications',
              description: 'Push tokens and recent delivery results.',
              metric: observability ? String(observability.notifications.activeDeviceTokens) : '-',
              metricLabel: 'tokens',
            },
            {
              href: '#buddy-lab',
              title: 'Buddy lab',
              description: 'Level and unlock controls for Buddy testing.',
              metric: buddyOverview ? String(buddyOverview.buddies.length) : '-',
              metricLabel: 'buddies',
            },
            {
              href: '#external-species',
              title: 'Species review',
              description: 'Triage externally confirmed plant IDs.',
              metric: externalSpecies ? String(externalSpecies.totals.needsReview) : '-',
              metricLabel: 'to review',
            },
            {
              href: '#audit',
              title: 'Audit',
              description: 'Admin actions and failures over the retention window.',
              metric: auditSummary ? String(auditSummary.failures) : '-',
              metricLabel: 'failures',
            },
          ]}
        />
        {observability ? (
          <section id="overview" className="scroll-mt-24 rounded-lg bg-white p-4 shadow-sm" aria-labelledby="observability-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="observability-heading" className="text-lg font-semibold text-gray-900">
                  Observability
                </h2>
                <p className="text-sm text-gray-600">
                  User, AI, notification, and admin activity health as of {new Date(observability.generatedAt).toLocaleString()}.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => load()}>
                Refresh
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <AdminMetric label="Users total" value={observability.users.total} />
              <AdminMetric label="Pending approval" value={observability.users.pending} />
              <AdminMetric label="New users 24h" value={observability.users.new24h} />
              <AdminMetric label="Users with plants" value={observability.users.withPlants} />
              <AdminMetric label="AI calls 24h" value={observability.ai.last24h.total} />
              <AdminMetric label="AI blocked 24h" value={observability.ai.last24h.blocked} />
              <AdminMetric label="AI images 30d" value={observability.ai.last30d.imageCount} />
              <AdminMetric label="AI paused users" value={observability.ai.pausedUsers.length} />
              <AdminMetric label="Push tokens" value={observability.notifications.activeDeviceTokens} />
              <AdminMetric label="Notifications 30d" value={sumCounts(observability.notifications.last30d)} />
              <AdminMetric label="Audit actions 30d" value={observability.audit.last30d} />
              <AdminMetric label="Audit failures 30d" value={observability.audit.failures30d} />
            </div>

            <div id="ai-usage" className="scroll-mt-24 mt-5 grid gap-4 lg:grid-cols-2">
              <AdminPanel title="AI status mix">
                {observability.ai.last30d.byStatus.length === 0 ? (
                  <p className="text-sm text-gray-600">No AI usage in the last 30 days.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {observability.ai.last30d.byStatus.map((item) => (
                      <span key={item.status} className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                        {item.status.toLowerCase()}: {item.count}
                      </span>
                    ))}
                  </div>
                )}
              </AdminPanel>

              <AdminPanel id="notifications" title="Notification delivery">
                {observability.notifications.last30d.length === 0 ? (
                  <p className="text-sm text-gray-600">No notification rows in the last 30 days.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {observability.notifications.last30d.map((item) => (
                      <span key={`${item.channel}-${item.status}`} className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-800">
                        {item.channel.toLowerCase()} {item.status}: {item.count}
                      </span>
                    ))}
                  </div>
                )}
              </AdminPanel>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <AdminPanel title="Top AI users">
                {observability.ai.topUsers.length === 0 ? (
                  <p className="text-sm text-gray-600">No AI users yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {observability.ai.topUsers.slice(0, 5).map((user) => (
                      <li key={user.userId} className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-gray-900">{user.email}</span>
                        <span className="shrink-0 text-xs font-semibold text-gray-600">
                          {user.calls} calls - {user.imageCount} images
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </AdminPanel>

              <AdminPanel title="Latest AI events">
                {observability.ai.latestEvents.length === 0 ? (
                  <p className="text-sm text-gray-600">No AI events logged yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {observability.ai.latestEvents.slice(0, 5).map((event) => (
                      <li key={event.id}>
                        <p className="text-gray-900">
                          {event.user?.email ?? 'Unknown user'} - {event.status.toLowerCase()} - {event.feature.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleString()}
                          {event.reason ? ` - ${event.reason}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </AdminPanel>
            </div>

            {observability.ai.pausedUsers.length ? (
              <div className="mt-5 rounded-lg border border-rose-100 bg-rose-50 p-3">
                <h3 className="text-sm font-semibold text-rose-950">Paused AI users</h3>
                <ul className="mt-2 space-y-1 text-sm text-rose-900">
                  {observability.ai.pausedUsers.map((user) => (
                    <li key={user.id}>
                      {user.email} until {new Date(user.aiPausedUntil).toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}
        {auditSummary ? (
          <section id="audit" className="scroll-mt-24 rounded-lg bg-white p-4 shadow-sm" aria-labelledby="audit-summary-heading">
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
        {externalSpecies ? (
          <section id="external-species" className="scroll-mt-24 rounded-lg bg-white p-4 shadow-sm" aria-labelledby="external-species-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="external-species-heading" className="text-lg font-semibold text-gray-900">
                  External species review
                </h2>
                <p className="text-sm text-gray-600">
                  User-confirmed long-tail IDs that entered the catalog from external photo identification.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => load()}>
                Refresh
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <AdminMetric label="External species" value={externalSpecies.totals.total} />
              <AdminMetric label="Needs review" value={externalSpecies.totals.needsReview} />
              <AdminMetric label="User confirmed" value={externalSpecies.totals.userConfirmed} />
              <AdminMetric label="Reviewed" value={externalSpecies.totals.reviewed} />
              <AdminMetric label="Curated" value={externalSpecies.totals.curated} />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Snapshot generated {new Date(externalSpecies.generatedAt).toLocaleString()}.
            </p>
            <p className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
              Review flow: save edited care/photo fields first, then mark reviewed or curated.
              Curated means the plant is launch-ready for normal users.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter external species review">
              {(['all', 'user_confirmed', 'reviewed', 'curated'] as ExternalSpeciesFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setExternalSpeciesFilter(filter)}
                  aria-pressed={externalSpeciesFilter === filter}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    externalSpeciesFilter === filter
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100'
                  }`}
                >
                  {filter === 'all' ? 'All' : externalSpeciesStatusLabel(filter)}
                </button>
              ))}
            </div>
            {externalSpecies.items.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 p-6 text-gray-600">
                No externally confirmed species are waiting in the catalog.
              </p>
            ) : visibleExternalSpecies.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 p-6 text-gray-600">
                No external species match this review filter.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {visibleExternalSpecies.map((species) => {
                  const draft = externalSpeciesDrafts[species.id] ?? externalSpeciesDraftFromRow(species);
                  return (
                    <article key={species.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-gray-950">{species.commonName}</h3>
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${externalSpeciesStatusClass(species.externalSource.status)}`}>
                              {externalSpeciesStatusLabel(species.externalSource.status)}
                            </span>
                          </div>
                          {species.scientificName ? (
                            <p className="mt-1 text-sm italic text-gray-600">{species.scientificName}</p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                              {species.externalSource.provider}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                              {formatConfidence(species.externalSource.confidence)}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
                              Water every {species.wateringFreqDays} days
                            </span>
                            <span className={`rounded-full px-2 py-1 font-semibold ${photoReviewStatusClass(species.externalSource.photoReviewStatus)}`}>
                              {photoReviewStatusLabel(species.externalSource.photoReviewStatus)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-gray-700">
                            {species.careNotes ?? 'No care notes saved yet.'}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            Confirmed {formatDateTime(species.externalSource.confirmedAt)}. Updated {formatDateTime(species.updatedAt)}.
                            {species.externalSource.reviewNote ? ` Review note: ${species.externalSource.reviewNote}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busyId === `species-reviewed-${species.id}` || species.externalSource.status === 'reviewed'}
                            onClick={() => reviewExternalSpecies(species.id, 'reviewed')}
                          >
                            Mark reviewed
                          </Button>
                          <Button
                            type="button"
                            disabled={busyId === `species-curated-${species.id}` || species.externalSource.status === 'curated'}
                            onClick={() => reviewExternalSpecies(species.id, 'curated')}
                          >
                            Mark curated
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 rounded-2xl bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-600">
                        Status buttons update review state only. Use Save review edits for care
                        notes, photo/license notes, or source notes.
                      </p>
                      <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 lg:grid-cols-2">
                      <label className="block text-sm">
                        <span className="font-semibold text-gray-700">Light baseline</span>
                        <input
                          type="text"
                          value={draft.sunlight}
                          maxLength={160}
                          onChange={(event) => updateExternalSpeciesDraft(species.id, { sunlight: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-semibold text-gray-700">Watering cadence days</span>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={draft.wateringFreqDays}
                          onChange={(event) => updateExternalSpeciesDraft(species.id, { wateringFreqDays: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-semibold text-gray-700">Toxicity / safety note</span>
                        <input
                          type="text"
                          value={draft.toxicity}
                          maxLength={220}
                          onChange={(event) => updateExternalSpeciesDraft(species.id, { toxicity: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-semibold text-gray-700">Default image URL</span>
                        <input
                          type="url"
                          value={draft.defaultImageUrl}
                          maxLength={500}
                          onChange={(event) => updateExternalSpeciesDraft(species.id, { defaultImageUrl: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                          placeholder="https://..."
                        />
                      </label>
                      <label className="block text-sm lg:col-span-2">
                        <span className="font-semibold text-gray-700">Care notes</span>
                        <textarea
                          value={draft.careNotes}
                          maxLength={1200}
                          rows={3}
                          onChange={(event) => updateExternalSpeciesDraft(species.id, { careNotes: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-semibold text-gray-700">Review note</span>
                        <textarea
                          value={draft.reviewNote}
                          maxLength={500}
                          rows={3}
                          onChange={(event) => updateExternalSpeciesDraft(species.id, { reviewNote: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                          placeholder="Decision notes for reviewed or curated status"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="font-semibold text-gray-700">Source notes</span>
                        <textarea
                          value={draft.sourceNote}
                          maxLength={500}
                          rows={3}
                          onChange={(event) => updateExternalSpeciesDraft(species.id, { sourceNote: event.target.value })}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                          placeholder="What was checked before review?"
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
                        <label className="block text-sm">
                          <span className="font-semibold text-gray-700">Photo review</span>
                          <select
                            value={draft.photoReviewStatus}
                            onChange={(event) =>
                              updateExternalSpeciesDraft(species.id, {
                                photoReviewStatus: event.target.value as PhotoReviewStatus,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                          >
                            <option value="unreviewed">Unreviewed</option>
                            <option value="approved">Approved</option>
                            <option value="needs_better_image">Needs better image</option>
                          </select>
                        </label>
                        <label className="block text-sm">
                          <span className="font-semibold text-gray-700">Photo/license note</span>
                          <textarea
                            value={draft.photoReviewNote}
                            maxLength={500}
                            rows={3}
                            onChange={(event) => updateExternalSpeciesDraft(species.id, { photoReviewNote: event.target.value })}
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                            placeholder="License, attribution, or replacement note"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busyId === `species-save-${species.id}`}
                        onClick={() => saveExternalSpeciesDraft(species.id)}
                      >
                        Save review edits
                      </Button>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
        {buddyOverview ? (
          <section id="buddy-lab" className="scroll-mt-24 rounded-lg bg-white p-4 shadow-sm" aria-labelledby="buddy-lab-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="buddy-lab-heading" className="text-lg font-semibold text-gray-900">
                  Buddy lab
                </h2>
                <p className="text-sm text-gray-600">
                  Admin-only controls for testing levels, shop items, homes, backgrounds, and furniture.
                </p>
              </div>
              <Button type="button" variant="secondary" onClick={() => load()}>
                Refresh
              </Button>
            </div>
            {buddyOverview.buddies.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 p-6 text-gray-600">
                No buddies have been created yet.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {buddyOverview.buddies.map((row) => {
                  const ownedIds = new Set(row.inventory.map((item) => item.itemId));
                  const draft = buddyLevelDrafts[row.buddy.id] ?? String(row.buddy.level);
                  return (
                    <div key={row.buddy.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {row.user.email}
                          </p>
                          <h3 className="mt-1 text-xl font-bold text-emerald-950">
                            {row.buddy.name}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-white px-2 py-1 font-semibold text-emerald-900">
                              Level {row.buddy.level}
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 font-semibold text-emerald-900">
                              {row.buddy.experiencePoints} XP
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 font-semibold text-emerald-900">
                              {row.inventory.length} items
                            </span>
                            <span className="rounded-full bg-white px-2 py-1 font-semibold text-emerald-900">
                              {row.buddy.speciesId}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-white p-3">
                          <label className="block text-xs font-semibold text-gray-700" htmlFor={`level-${row.buddy.id}`}>
                            Set level
                          </label>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busyId === `buddy-level-${row.buddy.id}` || row.buddy.level <= 1}
                              onClick={() => setBuddyLevel(row.buddy.id, String(row.buddy.level - 1))}
                            >
                              Level down
                            </Button>
                            <input
                              id={`level-${row.buddy.id}`}
                              type="number"
                              min={1}
                              max={buddyOverview.maxLevel}
                              value={draft}
                              onChange={(event) =>
                                setBuddyLevelDrafts((drafts) => ({
                                  ...drafts,
                                  [row.buddy.id]: event.target.value,
                                }))
                              }
                              className="h-10 w-20 rounded-lg border border-gray-200 px-2 text-sm font-semibold text-gray-900"
                            />
                            <Button
                              type="button"
                              disabled={busyId === `buddy-level-${row.buddy.id}`}
                              onClick={() => setBuddyLevel(row.buddy.id)}
                            >
                              Apply
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busyId === `buddy-level-${row.buddy.id}` || row.buddy.level >= buddyOverview.maxLevel}
                              onClick={() => setBuddyLevel(row.buddy.id, String(row.buddy.level + 1))}
                            >
                              Level up
                            </Button>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Max level {buddyOverview.maxLevel}. This sets XP to the selected level threshold.
                          </p>
                        </div>
                      </div>
                      <BuddyCatalogControls
                        catalog={buddyOverview.catalog}
                        ownedIds={ownedIds}
                        buddyId={row.buddy.id}
                        busyId={busyId}
                        onToggle={toggleBuddyItem}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
        <section id="accounts" className="scroll-mt-24 rounded-lg bg-white p-4 shadow-sm" aria-labelledby="accounts-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 id="accounts-heading" className="text-lg font-semibold text-gray-900">
                Accounts and access
              </h2>
              <p className="text-sm text-gray-600">
                {pendingUsers.length} pending approval, {disabledUsers.length} disabled, {pausedAiUsers.length} AI-paused.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          </div>
          {users.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 p-6 text-gray-600">No accounts found.</p>
          ) : (
          <ul className="mt-4 space-y-3">
            {users.map((u) => (
              <li
                key={u.id}
                className="rounded-2xl border border-gray-100 bg-white p-4"
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
        </section>
        <section id="audit-log" className="scroll-mt-24 rounded-lg bg-white p-4 shadow-sm" aria-labelledby="audit-log-heading">
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

function BuddyCatalogControls({
  catalog,
  ownedIds,
  buddyId,
  busyId,
  onToggle,
}: {
  catalog: AdminBuddyItem[];
  ownedIds: Set<string>;
  buddyId: string;
  busyId: string | null;
  onToggle: (buddyId: string, itemId: string, owned: boolean) => void;
}) {
  const byCategory = new Map<ShopItemCategory, AdminBuddyItem[]>();
  for (const item of catalog) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-emerald-950">Catalog ownership</p>
        <p className="text-xs text-gray-600">
          Unlocking bypasses shop cost, premium, season, species, and level gates for testing. Locking also unequips that item where needed.
        </p>
      </div>
      {SHOP_CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => (
        <details key={category} className="rounded-xl border border-emerald-100 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">
            {categoryLabel(category)} ({byCategory.get(category)?.length ?? 0})
          </summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(byCategory.get(category) ?? []).map((item) => {
              const owned = ownedIds.has(item.id);
              const busy = busyId === `buddy-item-${buddyId}-${item.id}`;
              return (
                <div key={item.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900" title={item.name}>
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[0.68rem] text-gray-500" title={item.id}>
                        {item.id}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Tier {item.tier} - level {item.levelRequired}
                        {item.requiresPremium ? ' - premium' : ''}
                        {item.seasonalEventId ? ' - seasonal' : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-bold ${owned ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-100 text-gray-700'}`}>
                      {owned ? 'Owned' : 'Locked'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={owned ? 'secondary' : 'primary'}
                    fullWidth
                    disabled={busy}
                    className="mt-3"
                    onClick={() => onToggle(buddyId, item.id, owned)}
                  >
                    {owned ? 'Lock' : 'Unlock'}
                  </Button>
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}

function AdminSectionLinks({
  items,
}: {
  items: {
    href: string;
    title: string;
    description: string;
    metric: string;
    metricLabel: string;
  }[];
}) {
  return (
    <nav aria-label="Admin sections" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-emerald-950">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">{item.description}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-lg font-bold text-emerald-900">{item.metric}</p>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                {item.metricLabel}
              </p>
            </div>
          </div>
        </a>
      ))}
    </nav>
  );
}

function categoryLabel(category: ShopItemCategory) {
  return category
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function AdminPanel({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-lg border border-gray-100 p-3">
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function sumCounts(items: { count: number }[]) {
  return items.reduce((sum, item) => sum + item.count, 0);
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

function externalSpeciesStatusLabel(status: ExternalSourceStatus) {
  if (status === 'curated') return 'Curated';
  if (status === 'reviewed') return 'Reviewed';
  return 'User confirmed';
}

function externalSpeciesStatusClass(status: ExternalSourceStatus) {
  if (status === 'curated') return 'bg-emerald-100 text-emerald-900';
  if (status === 'reviewed') return 'bg-blue-100 text-blue-900';
  return 'bg-amber-100 text-amber-900';
}

function photoReviewStatusLabel(status?: PhotoReviewStatus) {
  if (status === 'approved') return 'Photo approved';
  if (status === 'needs_better_image') return 'Needs better image';
  return 'Photo unreviewed';
}

function photoReviewStatusClass(status?: PhotoReviewStatus) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-900';
  if (status === 'needs_better_image') return 'bg-amber-100 text-amber-900';
  return 'bg-gray-100 text-gray-700';
}

function emptyExternalSpeciesDraft(): ExternalSpeciesDraft {
  return {
    sunlight: '',
    wateringFreqDays: '7',
    toxicity: '',
    careNotes: '',
    defaultImageUrl: '',
    reviewNote: '',
    sourceNote: '',
    photoReviewStatus: 'unreviewed',
    photoReviewNote: '',
  };
}

function externalSpeciesDraftFromRow(species: AdminExternalSpeciesRow): ExternalSpeciesDraft {
  return {
    sunlight: species.sunlight ?? '',
    wateringFreqDays: String(species.wateringFreqDays ?? 7),
    toxicity: species.toxicity ?? '',
    careNotes: species.careNotes ?? '',
    defaultImageUrl: species.defaultImageUrl ?? '',
    reviewNote: species.externalSource.reviewNote ?? '',
    sourceNote: species.externalSource.sourceNote ?? '',
    photoReviewStatus: species.externalSource.photoReviewStatus ?? 'unreviewed',
    photoReviewNote: species.externalSource.photoReviewNote ?? '',
  };
}

function textOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function formatConfidence(value?: number) {
  if (typeof value !== 'number') return 'Confidence unknown';
  return `${Math.round(value * 100)}% confidence`;
}

function formatDateTime(value?: string | null) {
  if (!value) return 'unknown time';
  return new Date(value).toLocaleString();
}

function shortId(value?: string | null) {
  if (!value) return '-';
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}
