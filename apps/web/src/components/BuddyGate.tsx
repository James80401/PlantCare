import { Navigate, Outlet, useLocation } from 'react-router-dom';
import BuddySubNav from './buddy/BuddySubNav';
import { useBuddy } from '../hooks/buddy/useBuddy';

/** Routes under /garden/buddy require an adopted buddy, but setup remains skippable. */
export function BuddyGate() {
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
