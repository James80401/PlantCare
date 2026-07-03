import { Navigate, Outlet, useLocation } from 'react-router-dom';
import BuddySubNav from './buddy/BuddySubNav';
import { useBuddy } from '../hooks/buddy/useBuddy';

const BUDDY_ENABLED = import.meta.env.VITE_ENABLE_PLANT_BUDDY === 'true';

/** Routes under /garden/buddy require an adopted buddy, but setup remains skippable. */
export function BuddyGate() {
  // Plant Buddy is a post-release feature. Bail out before calling useBuddy()
  // so a disabled build never fires the buddy fetch — this is a build-time
  // constant, never toggled at runtime, so it's safe ahead of the hook calls.
  if (!BUDDY_ENABLED) {
    return <Navigate to="/garden" replace />;
  }

  return <BuddyGateInner />;
}

function BuddyGateInner() {
  const { loading, missing } = useBuddy();
  const location = useLocation();
  const onOnboarding = location.pathname.endsWith('/buddy/onboarding');

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-emerald-700">
        Loading buddy...
      </div>
    );
  }

  if (missing && !onOnboarding) {
    return <Navigate to="/garden/buddy/onboarding" replace />;
  }

  if (!missing && onOnboarding) {
    return <Navigate to="/garden/buddy" replace />;
  }

  if (onOnboarding) {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <BuddySubNav />
      <Outlet />
    </div>
  );
}
