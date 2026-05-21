import { Link, Outlet, useLocation } from 'react-router-dom';
import { navIcons } from './icons/NavIcons';
import { useAuth } from '../context/AuthContext';
import { BuddyCompanionProvider } from '../context/BuddyCompanionContext';
import BuddyFloatingCompanion from './buddy/BuddyFloatingCompanion';

const mobileNav = [
  { to: '/garden', label: 'Dashboard', mobileLabel: 'Home', icon: 'home' as const, exact: true },
  { to: '/garden/plants/browse', label: 'Browse', mobileLabel: 'Browse', icon: 'browse' as const, exact: true },
  { to: '/garden/tasks', label: 'Tasks', mobileLabel: 'Tasks', icon: 'tasks' as const },
  { to: '/garden/buddy', label: 'Buddy', mobileLabel: 'Buddy', icon: 'add' as const },
  { to: '/garden/community', label: 'Community', mobileLabel: 'Tips', icon: 'community' as const },
  { to: '/garden/plants/new', label: 'Add Plant', mobileLabel: 'Add', icon: 'add' as const, exact: true },
  { to: '/garden/settings', label: 'Settings', mobileLabel: 'Settings', icon: 'settings' as const },
];

const desktopNav = mobileNav;

/** Hide upgrade CTAs during beta — all features enabled */
const SHOW_UPGRADE = false;

export default function Layout() {
  const { user, logout, isPremium } = useAuth();
  const location = useLocation();

  return (
    <BuddyCompanionProvider>
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-page, #f7f6f2)' }}>
      <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md">
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
            <Link to="/garden" className="min-w-0 text-xl font-bold tracking-tight font-display">
              <span className="block truncate">Plant Care</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              {desktopNav.map(({ to, label, exact }) => {
                const active = isActivePath(location.pathname, to, exact);
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-full px-3 py-2 transition ${
                      active
                        ? 'bg-white/12 text-emerald-50 font-semibold'
                        : 'text-emerald-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              {SHOW_UPGRADE && !isPremium && (
                <Link
                  to="/garden/subscription"
                  className="rounded-full px-3 py-2 font-semibold text-amber-300 hover:bg-white/10 hover:text-amber-200"
                >
                  Upgrade
                </Link>
              )}
            </nav>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden md:inline opacity-90 truncate max-w-[12rem]">{user?.email}</span>
              {isPremium && (
                <span className="bg-amber-400 text-emerald-900 text-xs px-2 py-0.5 rounded-full font-medium">
                  Beta
                </span>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-full min-h-11 min-w-11 px-2 py-1 text-emerald-200 hover:bg-white/10 hover:text-white"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 sm:py-6 page-garden">
        <Outlet />
      </main>
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pt-2 text-xs shadow-[0_-12px_30px_rgba(6,78,59,0.08)] backdrop-blur"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-lg grid-cols-7 gap-px">
          {mobileNav.map(({ to, mobileLabel, icon, exact }) => {
            const active = isActivePath(location.pathname, to, exact);
            const Icon = navIcons[icon];
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1.5 transition ${
                  active
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <Icon className="h-6 w-6" aria-hidden />
                <span className="mt-1 font-medium">{mobileLabel}</span>
              </Link>
            );
          })}
        </div>
        {SHOW_UPGRADE && !isPremium && (
          <Link
            to="/garden/subscription"
            className="mx-auto mt-2 flex max-w-md items-center justify-center rounded-2xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900"
          >
            Upgrade for premium care
          </Link>
        )}
      </nav>
      <BuddyFloatingCompanion />
    </div>
    </BuddyCompanionProvider>
  );
}

function isActivePath(pathname: string, target: string, exact?: boolean) {
  if (exact) return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
}
