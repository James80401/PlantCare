import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicSiteConfig, shouldRenderMarketingRoutes } from '../seo/siteConfig';

const MarketingRoutePage = lazy(() => import('../pages/marketing/MarketingPage'));

/** Public home: signed-in users go to garden; guests go to sign in (private beta). */
export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f6f2] text-emerald-800">
        Loading…
      </div>
    );
  }

  if (user) return <Navigate to="/garden" replace />;
  if (shouldRenderMarketingRoutes(publicSiteConfig)) return <MarketingRoutePage routePath="/" />;

  return <Navigate to="/login" replace />;
}
