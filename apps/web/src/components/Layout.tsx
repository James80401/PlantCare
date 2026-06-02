import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SkipLink } from './a11y/SkipLink';
import { navIcons } from './icons/NavIcons';
import { useAuth } from '../context/AuthContext';
import { BuddyCompanionProvider, useBuddyCompanion } from '../context/BuddyCompanionContext';
import BuddyFloatingCompanion from './buddy/BuddyFloatingCompanion';
import { useBuddyQuestBadge } from '../hooks/buddy/useBuddyQuestBadge';
import { usePushNotifications } from '../hooks/usePushNotifications';

type NavIconKey = keyof typeof navIcons;

type NavItem = {
  to: string;
  label: string;
  mobileLabel: string;
  icon: NavIconKey;
  exact?: boolean;
  adminOnly?: boolean;
  premiumOnly?: boolean;
  freeOnly?: boolean;
};

const primaryNav: NavItem[] = [
  { to: '/garden', label: 'Home', mobileLabel: 'Home', icon: 'home', exact: true },
  { to: '/garden/gardens', label: 'Gardens', mobileLabel: 'Gardens', icon: 'browse' },
  { to: '/garden/plants/browse', label: 'Browse', mobileLabel: 'Browse', icon: 'browse' },
  { to: '/garden/community', label: 'Tips', mobileLabel: 'Tips', icon: 'community' },
];

const settingsNav: NavItem = {
  to: '/garden/settings',
  label: 'Settings',
  mobileLabel: 'Settings',
  icon: 'settings',
};

const moreNav: NavItem[] = [
  { to: '/garden/plants/new', label: 'Add plant', mobileLabel: 'Add', icon: 'add', exact: true },
  { to: '/garden/tasks', label: 'Tasks', mobileLabel: 'Tasks', icon: 'tasks' },
  { to: '/garden/calendar', label: 'Calendar', mobileLabel: 'Calendar', icon: 'calendar' },
  { to: '/garden/buddy', label: 'Plant Buddy', mobileLabel: 'Buddy', icon: 'add' },
  { to: '/garden/household', label: 'Household', mobileLabel: 'Household', icon: 'community' },
  { to: '/garden/insights/score', label: 'Garden score', mobileLabel: 'Score', icon: 'tasks' },
  {
    to: '/garden/subscription',
    label: 'Upgrade',
    mobileLabel: 'Upgrade',
    icon: 'admin',
    freeOnly: true,
  },
];

const adminNav: NavItem = {
  to: '/admin',
  label: 'Admin',
  mobileLabel: 'Admin',
  icon: 'admin',
};

const SHOW_UPGRADE = import.meta.env.VITE_ENABLE_PREMIUM_BILLING === 'true';

export default function Layout() {
  const auth = useAuth();
  return (
    <BuddyCompanionProvider>
      <LayoutShell {...auth} />
    </BuddyCompanionProvider>
  );
}

function LayoutShell({
  user,
  logout,
  isPremium,
}: ReturnType<typeof useAuth>) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const desktopMoreMenuRef = useRef<HTMLDivElement>(null);
  const mobileMoreMenuRef = useRef<HTMLDivElement>(null);
  const { missing: buddyMissing } = useBuddyCompanion();
  const buddyQuestClaims = useBuddyQuestBadge(Boolean(user) && !buddyMissing);
  const MenuIcon = navIcons.menu;
  const primaryItems = user?.isAdmin
    ? [...primaryNav, adminNav, settingsNav]
    : [...primaryNav, settingsNav];
  const secondaryItems = moreNav.filter((item) => {
    if (item.freeOnly && (isPremium || !SHOW_UPGRADE)) return false;
    if (item.premiumOnly && !isPremium) return false;
    if (item.adminOnly && !user?.isAdmin) return false;
    return true;
  });
  const hasActiveSecondary = secondaryItems.some((item) =>
    isActivePath(location.pathname, item.to, item.exact),
  );
  usePushNotifications(Boolean(user));

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !desktopMoreMenuRef.current?.contains(target) &&
        !mobileMoreMenuRef.current?.contains(target)
      ) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [moreOpen]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-page, #f7f6f2)' }}>
      <SkipLink />
      <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md">
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
            <Link to="/garden" className="min-w-0 text-xl font-bold tracking-tight font-display">
              <span className="block truncate">Plant Care</span>
            </Link>
            <nav className="hidden sm:flex items-center gap-1 text-sm" aria-label="Main">
              {primaryItems.map(({ to, label, exact }) => {
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
              <MoreMenu
                items={secondaryItems}
                open={moreOpen}
                active={hasActiveSecondary}
                onToggle={() => setMoreOpen((value) => !value)}
                menuRef={desktopMoreMenuRef}
                buddyQuestClaims={buddyQuestClaims}
                currentPath={location.pathname}
              />
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
                aria-label="Log out"
                className="rounded-full min-h-11 min-w-11 px-3 py-1 text-emerald-200 hover:bg-white/10 hover:text-white"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="page-garden flex-1 max-w-6xl w-full mx-auto px-4 py-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:py-6 sm:pb-6 focus:outline-none"
      >
        <Outlet />
      </main>
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pt-2 text-xs shadow-[0_-12px_30px_rgba(6,78,59,0.08)] backdrop-blur"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
        aria-label="Primary"
      >
        <div
          className="mx-auto grid max-w-lg gap-px"
          style={{ gridTemplateColumns: `repeat(${primaryItems.length + 1}, minmax(0, 1fr))` }}
        >
          {primaryItems.map(({ to, mobileLabel, icon, exact }) => {
            const active = isActivePath(location.pathname, to, exact);
            const Icon = navIcons[icon];
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1.5 transition ${
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
          <div className="relative" ref={mobileMoreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
              aria-controls="mobile-more-menu"
              className={`relative flex min-h-14 w-full flex-col items-center justify-center rounded-2xl px-2 py-1.5 transition ${
                hasActiveSecondary || moreOpen
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-emerald-50 hover:text-emerald-800'
              }`}
            >
              <MenuIcon className="h-6 w-6" aria-hidden />
              {buddyQuestClaims > 0 ? (
                <span
                  className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-emerald-950"
                  aria-hidden
                >
                  {buddyQuestClaims > 9 ? '9+' : buddyQuestClaims}
                </span>
              ) : null}
              <span className="mt-1 font-medium">More</span>
              {buddyQuestClaims > 0 ? (
                <span className="sr-only">
                  , {buddyQuestClaims} quest{buddyQuestClaims === 1 ? '' : 's'} ready to claim
                </span>
              ) : null}
            </button>
            {moreOpen ? (
              <div
                id="mobile-more-menu"
                className="absolute bottom-[calc(100%+0.75rem)] right-0 w-56 rounded-2xl border border-emerald-100 bg-white p-2 text-sm shadow-2xl"
              >
                <MoreMenuLinks
                  items={secondaryItems}
                  buddyQuestClaims={buddyQuestClaims}
                  currentPath={location.pathname}
                />
              </div>
            ) : null}
          </div>
        </div>
      </nav>
      <BuddyFloatingCompanion />
    </div>
  );
}

function MoreMenu({
  items,
  open,
  active,
  onToggle,
  menuRef,
  buddyQuestClaims,
  currentPath,
}: {
  items: NavItem[];
  open: boolean;
  active: boolean;
  onToggle: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
  buddyQuestClaims: number;
  currentPath: string;
}) {
  const MenuIcon = navIcons.menu;
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="desktop-more-menu"
        className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 py-2 transition ${
          active || open
            ? 'bg-white/12 text-emerald-50 font-semibold'
            : 'text-emerald-100 hover:bg-white/10 hover:text-white'
        }`}
      >
        <MenuIcon className="h-5 w-5" aria-hidden />
        <span>More</span>
        {buddyQuestClaims > 0 ? (
          <span
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-emerald-950"
            aria-hidden
          >
            {buddyQuestClaims > 9 ? '9+' : buddyQuestClaims}
          </span>
        ) : null}
        {buddyQuestClaims > 0 ? (
          <span className="sr-only">
            , {buddyQuestClaims} quest{buddyQuestClaims === 1 ? '' : 's'} ready to claim
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          id="desktop-more-menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] w-60 rounded-2xl border border-emerald-100 bg-white p-2 text-sm text-emerald-950 shadow-2xl"
        >
          <MoreMenuLinks
            items={items}
            buddyQuestClaims={buddyQuestClaims}
            currentPath={currentPath}
          />
        </div>
      ) : null}
    </div>
  );
}

function MoreMenuLinks({
  items,
  buddyQuestClaims,
  currentPath,
}: {
  items: NavItem[];
  buddyQuestClaims: number;
  currentPath: string;
}) {
  return (
    <div className="grid gap-1">
      {items.map(({ to, label, icon, exact }) => {
        const Icon = navIcons[icon];
        const active = isActivePath(currentPath, to, exact);
        const showQuestBadge = to === '/garden/buddy' && buddyQuestClaims > 0;
        return (
          <Link
            key={to}
            to={to}
            className={`relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 font-medium transition focus:outline-none ${
              active
                ? 'bg-emerald-800 text-white'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 focus:bg-emerald-50'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-emerald-700'}`} aria-hidden />
            <span>{label}</span>
            {showQuestBadge ? (
              <span
                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-emerald-950"
                aria-hidden
              >
                {buddyQuestClaims > 9 ? '9+' : buddyQuestClaims}
              </span>
            ) : null}
            {showQuestBadge ? (
              <span className="sr-only">
                , {buddyQuestClaims} quest{buddyQuestClaims === 1 ? '' : 's'} ready to claim
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

function isActivePath(pathname: string, target: string, exact?: boolean) {
  if (exact) return pathname === target;
  return pathname === target || pathname.startsWith(`${target}/`);
}
