import { Link } from 'react-router-dom';
import type { GardenSummaryCard } from '../../services/api';

const STATUS_STYLES: Record<string, string> = {
  'Needs attention': 'bg-rose-50 text-rose-700 border-rose-200',
  'Care overdue': 'bg-amber-50 text-amber-800 border-amber-200',
  'Care due today': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'All caught up': 'bg-sky-50 text-sky-700 border-sky-200',
  'No plants yet': 'bg-gray-50 text-gray-600 border-gray-200',
};

function gardenPath(id: string) {
  return `/garden/gardens/${id}`;
}

function environmentLabel(value?: string | null) {
  if (value === 'Outdoor') return 'Outdoor garden';
  return 'Indoor garden';
}

/**
 * Summary card for a single garden — used on the landing "Your gardens" area and the
 * My Gardens page. Whole card links to the Garden Dashboard; small quick-links deep-link
 * into that garden's task / care / plant views.
 */
export function GardenCard({ garden }: { garden: GardenSummaryCard }) {
  const statusStyle = STATUS_STYLES[garden.status] ?? STATUS_STYLES['All caught up'];

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5 transition hover:border-emerald-200 hover:shadow-md">
      <Link to={gardenPath(garden.id)} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-emerald-950 font-display">
              {garden.name}
            </h3>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {environmentLabel(garden.location)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyle}`}
          >
            {garden.status}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Plants" value={garden.plantCount} />
          <Stat label="Due today" value={garden.tasksDueToday} highlight={garden.tasksDueToday > 0} />
          <Stat label="Overdue" value={garden.overdue} urgent={garden.overdue > 0} />
        </dl>

        {garden.urgentAlerts > 0 ? (
          <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            ⚠ {garden.urgentAlerts} plant{garden.urgentAlerts === 1 ? '' : 's'} need a closer look
          </p>
        ) : null}
      </Link>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-emerald-50 pt-3 text-sm">
        <QuickLink to={`${gardenPath(garden.id)}/tasks`} label="Tasks" />
        <QuickLink to={`${gardenPath(garden.id)}/care`} label="Plant Care" />
        <QuickLink to={`${gardenPath(garden.id)}/plants`} label="Plants" />
        {!garden.isOwner ? (
          <span className="ml-auto inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
            Shared with you
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  urgent,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  urgent?: boolean;
}) {
  const color = urgent ? 'text-rose-600' : highlight ? 'text-emerald-700' : 'text-gray-900';
  return (
    <div className="rounded-2xl bg-emerald-50/40 py-2">
      <dd className={`text-xl font-bold ${color}`}>{value}</dd>
      <dt className="text-[11px] uppercase tracking-wide text-gray-500">{label}</dt>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-1 font-medium text-emerald-800 transition hover:bg-emerald-50"
    >
      {label}
    </Link>
  );
}
