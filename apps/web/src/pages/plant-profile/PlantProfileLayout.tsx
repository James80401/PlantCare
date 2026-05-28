import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { SharePlantCard } from '../../components/engagement/SharePlantCard';
import { plantProfileDetailsPath } from '../../utils/gardenPaths';
import { DR_PLANT_SECTION_ID, plantDrPlantPath, plantHealthPath, PROFILE_TABS } from './constants';
import { PlantProfileProvider, usePlantProfile } from './PlantProfileContext';
import { SummaryTile } from './shared';
import { taskTypeLabel } from '../../utils/tasks';
function PlantProfileShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const ctx = usePlantProfile();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    const mapped =
      hash === 'diagnosis' || hash === DR_PLANT_SECTION_ID
        ? 'health'
        : hash;
    if (PROFILE_TABS.some((t) => t.id === mapped)) {
      navigate(
        {
          pathname: `/garden/plants/${ctx.id}/${mapped}`,
          hash: hash === DR_PLANT_SECTION_ID ? `#${DR_PLANT_SECTION_ID}` : '',
        },
        { replace: true },
      );
    }
  }, [location.hash, ctx.id, navigate]);

  const { plant, species, plantLabel, sectionCounts, nextTask, careOverview, currentLocation } =
    ctx;

  return (
    <div className="space-y-5 min-w-0">
      <Link
        to="/garden"
        className="inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
      >
        ← Back to garden
      </Link>

      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
        <div className="grid gap-5 p-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-6">
          <div className="h-36 w-full overflow-hidden rounded-3xl bg-emerald-100 sm:h-36 sm:w-36">
            {(plant.imageUrl as string) ? (
              <img
                src={plant.imageUrl as string}
                alt={`Photo of ${plantLabel}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-5xl" aria-hidden>
                🌿
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Plant profile
            </p>
            <h1 className="mt-1 text-3xl font-bold text-emerald-950 font-display">{plantLabel}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {species.commonName as string}
              {species.scientificName ? (
                <span className="italic"> · {species.scientificName as string}</span>
              ) : null}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <Link to={plantHealthPath(ctx.id)} className="block rounded-2xl transition hover:ring-2 hover:ring-emerald-200">
                <SummaryTile
                  label="Health"
                  value={
                    ctx.activeDiagnosisCount > 0
                      ? `${ctx.activeDiagnosisCount} active`
                      : 'Clear'
                  }
                  tone={ctx.activeDiagnosisCount > 0 ? 'rose' : 'emerald'}
                />
              </Link>
              <SummaryTile
                label="Next task"
                value={
                  ctx.nextTask
                    ? `${taskTypeLabel(ctx.nextTask.taskType as string)} · ${format(new Date(ctx.nextTask.dueDate as string), 'MMM d')}`
                    : 'Nothing scheduled'
                }
                tone={ctx.nextTask ? 'amber' : 'emerald'}
              />
              <SummaryTile
                label="Location"
                value={
                  careOverview?.environmentLabel
                    ? `${currentLocation} · ${careOverview.environmentLabel}`
                    : currentLocation
                }
                tone="emerald"
              />
              <SummaryTile
                label="Watering"
                value={`Every ${species.wateringFreqDays as number} days base`}
                tone="sky"
              />
              <SummaryTile
                label="Light"
                value={(species.sunlight as string) || 'Not specified'}
                tone="emerald"
              />
            </div>

            {species.toxicity ? (
              <p
                role="note"
                className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                <span aria-hidden>⚠️ </span>
                {String(species.toxicity)}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={plantDrPlantPath(ctx.id)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
              >
                Ask Dr. Plant
              </Link>
              <Link
                to={plantProfileDetailsPath(ctx.id)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
              >
                Edit details
              </Link>
              <button
                type="button"
                onClick={() => ctx.setSharingPlant(true)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
              >
                Share plant card
              </button>
            </div>
          </div>
        </div>
      </section>

      {ctx.sharingPlant ? (
        <SharePlantCard
          snapshot={{
            plantName: plantLabel,
            speciesName: species.commonName as string,
            scientificName: (species.scientificName as string) || null,
            location: currentLocation,
            sunlight: (species.sunlight as string) || null,
            nextCareLabel: nextTask
              ? `${taskTypeLabel(nextTask.taskType as string)} · ${format(new Date(nextTask.dueDate as string), 'MMM d')}`
              : null,
          }}
          onClose={() => ctx.setSharingPlant(false)}
        />
      ) : null}

      <nav
        className="sticky top-[4.5rem] z-20 overflow-x-auto rounded-2xl border border-emerald-100 bg-white/95 p-1 shadow-sm shadow-emerald-900/5 backdrop-blur"
        aria-label="Plant profile sections"
      >
        <div className="flex min-w-max gap-1">
          {PROFILE_TABS.map((section) => (
            <NavLink
              key={section.id}
              to={`/garden/plants/${ctx.id}/${section.id}`}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-emerald-800 text-white'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`
              }
            >
              {section.label}
              {section.id === 'tasks' && sectionCounts.tasks ? ` (${sectionCounts.tasks})` : ''}
              {section.id === 'journal' && sectionCounts.journal
                ? ` (${sectionCounts.journal})`
                : ''}
              {section.id === 'health' && ctx.activeDiagnosisCount > 0
                ? ` (${ctx.activeDiagnosisCount})`
                : ''}
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

export default function PlantProfileLayout() {
  return (
    <PlantProfileProvider>
      <PlantProfileShell />
    </PlantProfileProvider>
  );
}
