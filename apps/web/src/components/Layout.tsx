import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/garden', label: 'Home' },
  { to: '/garden/tasks', label: 'Tasks' },
  { to: '/garden/plants/new', label: 'Add Plant' },
  { to: '/garden/settings', label: 'Settings' },
];

export default function Layout() {
  const { user, logout, isPremium } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f6f2]">
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/garden" className="text-xl font-bold tracking-tight">
            Plant Care
          </Link>
          <nav className="hidden sm:flex gap-4 text-sm">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`hover:text-emerald-200 ${location.pathname === to ? 'text-emerald-200 font-medium' : ''}`}
              >
                {label}
              </Link>
            ))}
            {!isPremium && (
              <Link to="/garden/subscription" className="text-amber-300 hover:text-amber-200">
                Upgrade
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden md:inline opacity-90">{user?.email}</span>
            {isPremium && (
              <span className="bg-amber-400 text-emerald-900 text-xs px-2 py-0.5 rounded-full font-medium">
                Premium
              </span>
            )}
            <button
              type="button"
              onClick={logout}
              className="text-emerald-200 hover:text-white"
            >
              Log out
            </button>
          </div>
          </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-emerald-100 flex justify-around py-2 text-xs">
        {nav.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center px-2 ${location.pathname === to ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
