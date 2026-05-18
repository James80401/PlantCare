import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Sends new users through onboarding before the main garden shell. */
export function OnboardingGate() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-emerald-700">
        Loading…
      </div>
    );
  }

  const onOnboarding = location.pathname.startsWith('/garden/onboarding');
  if (user && !user.onboardingCompletedAt && !onOnboarding) {
    return <Navigate to="/garden/onboarding" replace />;
  }

  if (user?.onboardingCompletedAt && onOnboarding) {
    return <Navigate to="/garden" replace />;
  }

  return <Outlet />;
}
