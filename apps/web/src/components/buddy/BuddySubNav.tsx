import { Link, useLocation } from 'react-router-dom';

const LINKS: ReadonlyArray<{ to: string; label: string; exact?: boolean }> = [
  { to: '/garden/buddy', label: 'Home', exact: true },
  { to: '/garden/buddy/activities', label: 'Activities' },
  { to: '/garden/buddy/quests', label: 'Quests' },
  { to: '/garden/buddy/style', label: 'Style' },
  { to: '/garden/buddy/town', label: 'Town' },
  { to: '/garden/buddy/journey', label: 'Journey' },
];

export default function BuddySubNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-2xl border border-emerald-100 bg-white/80 p-1 text-xs font-semibold"
      aria-label="Buddy sections"
    >
      {LINKS.map(({ to, label, exact }) => {
        const active = exact ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`shrink-0 rounded-xl px-3 py-2 transition ${
              active ? 'bg-emerald-800 text-white' : 'text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
