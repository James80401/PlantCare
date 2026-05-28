import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { adminApi, usersApi } from '../../services/api';

type PendingUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export default function AdminRegistrations() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: me } = await usersApi.me();
    setIsAdmin(Boolean(me.isAdmin));
    if (!me.isAdmin) return;
    const { data } = await adminApi.listPending();
    setPending(data);
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

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/garden" replace />;
  }

  return (
    <div className="min-h-screen bg-emerald-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-emerald-900">Pending registrations</h1>
          <Link to="/garden" className="text-sm font-medium text-emerald-800 hover:underline">
            Back to app
          </Link>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {pending.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600 shadow-sm">No pending accounts.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((u) => (
              <li
                key={u.id}
                className="rounded-2xl bg-white p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">{u.email}</p>
                  {u.name ? <p className="text-sm text-gray-600">{u.name}</p> : null}
                  <p className="text-xs text-gray-500 mt-1">
                    {u.emailVerified ? 'Email verified' : 'Email not verified yet'} ·{' '}
                    {new Date(u.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    disabled={busyId === u.id || !u.emailVerified}
                    onClick={() => approve(u.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyId === u.id}
                    onClick={() => reject(u.id)}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
