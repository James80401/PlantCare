import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBuddy } from '../hooks/buddy/useBuddy';

/** Routes under /garden/buddy require an adopted buddy (except onboarding). */
export function BuddyGate() {
  const { loading, missing } = useBuddy();
  const location = useLocation();
  const onOnboarding = location.pathname.endsWith('/buddy/onboarding');

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-emerald-700">
        Loading buddy…
      </div>
    );
  }

  if (missing && !onOnboarding) {
    return <Navigate to="/garden/buddy/onboarding" replace />;
  }

  if (!missing && onOnboarding) {
    return <Navigate to="/garden/buddy" replace />;
  }

  return <Outlet />;
}
