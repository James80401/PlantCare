import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { billingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

type BillingStatus = {
  planTier: 'FREE' | 'PREMIUM';
  isPremium: boolean;
  subscription: { status: string; planName: string; createdAt: string } | null;
  limits: { plants: number; identificationsPerWindow: number; identifyWindowDays: number };
  usage: { plants: number; identifications: number; identifyResetAt: string };
  priceLabel: string;
  trialDays: number;
  canManageSubscription: boolean;
};

const PREMIUM_BILLING_ENABLED = import.meta.env.VITE_ENABLE_PREMIUM_BILLING === 'true';

export default function Subscription() {
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'checkout' | 'portal' | null>(null);

  useEffect(() => {
    if (!PREMIUM_BILLING_ENABLED) {
      void refreshUser();
      return;
    }

    billingApi
      .status()
      .then(({ data }) => setStatus(data))
      .catch(() => setError('Could not load subscription status.'));
    void refreshUser();
  }, [refreshUser]);

  const checkout = async () => {
    setBusy('checkout');
    setError('');
    try {
      const { data } = await billingApi.checkout();
      window.location.href = data.url;
    } catch {
      setError('Could not start checkout. Try again in a moment.');
      setBusy(null);
    }
  };

  const manage = async () => {
    setBusy('portal');
    setError('');
    try {
      const { data } = await billingApi.portal();
      window.location.href = data.url;
    } catch {
      setError('Could not open subscription management.');
      setBusy(null);
    }
  };

  if (!PREMIUM_BILLING_ENABLED) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-20">
        <div>
          <Link to="/garden" className="text-sm font-medium text-emerald-700 hover:underline">
            Back to garden
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-emerald-950">Premium</h1>
          <p className="mt-1 text-sm text-gray-600">
            Premium billing is not open yet. Current approved accounts keep full beta access.
          </p>
        </div>

        <Card className="space-y-3 text-sm text-gray-700">
          <p className="font-semibold text-emerald-950">Beta access is active</p>
          <p>
            You can keep using DrPlant while subscriptions are being prepared.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      <div>
        <Link to="/garden" className="text-sm font-medium text-emerald-700 hover:underline">
          Back to garden
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-emerald-950">Premium</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track more plants and identify more species with DrPlant Premium.
        </p>
      </div>

      {searchParams.get('success') ? (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
          Checkout complete. Your Premium status may take a moment to update.
        </p>
      ) : null}
      {searchParams.get('canceled') ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Checkout was canceled. Your account was not changed.
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card className="space-y-5">
        {!status ? (
          <p className="text-sm text-gray-600">Loading subscription...</p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Current plan
                </p>
                <p className="mt-1 text-3xl font-bold text-emerald-950">
                  {status.isPremium ? 'Premium' : 'Free'}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Premium is {status.priceLabel} after a {status.trialDays}-day free trial.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-900">
                {status.subscription?.status ?? (status.isPremium ? 'Active' : 'Free')}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <UsageCard
                label="Plants"
                value={status.usage.plants}
                limit={status.isPremium ? null : status.limits.plants}
              />
              <UsageCard
                label="Identifications"
                value={status.usage.identifications}
                limit={status.isPremium ? null : status.limits.identificationsPerWindow}
                helper={
                  status.isPremium
                    ? undefined
                    : `Resets ${new Date(status.usage.identifyResetAt).toLocaleDateString()}`
                }
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {!status.isPremium ? (
                <Button fullWidth onClick={checkout} disabled={busy !== null}>
                  {busy === 'checkout' ? 'Opening checkout...' : `Start ${status.trialDays}-day trial`}
                </Button>
              ) : null}
              {status.canManageSubscription ? (
                <Button
                  fullWidth
                  variant={status.isPremium ? 'primary' : 'secondary'}
                  onClick={manage}
                  disabled={busy !== null}
                >
                  {busy === 'portal' ? 'Opening...' : 'Manage subscription'}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </Card>

      <Card className="space-y-3 text-sm text-gray-700">
        <p className="font-semibold text-emerald-950">Premium includes</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Unlimited plant tracking.</li>
          <li>More photo identifications.</li>
          <li>Premium buddy shop items.</li>
        </ul>
      </Card>
    </div>
  );
}

function UsageCard({
  label,
  value,
  limit,
  helper,
}: {
  label: string;
  value: number;
  limit: number | null;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      <p className="text-sm font-semibold text-emerald-900">{label}</p>
      <p className="mt-2 text-2xl font-bold text-emerald-950">
        {value}
        {limit !== null ? <span className="text-base font-medium text-gray-600"> / {limit}</span> : null}
      </p>
      <p className="mt-1 text-xs text-gray-600">{helper ?? (limit === null ? 'Unlimited with Premium' : 'Free plan usage')}</p>
    </div>
  );
}
