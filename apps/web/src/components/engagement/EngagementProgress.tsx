import type { GardenWellness, Milestone } from '../../utils/engagement';

export function EngagementProgress({
  wellness,
  streak,
  milestones,
}: {
  wellness: GardenWellness;
  streak: number;
  milestones: Milestone[];
}) {
  if (wellness.score === 0) return null;

  return (
    <section
      className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-5 shadow-sm shadow-emerald-900/5"
      aria-label="Your progress"
    >
      <ProgressHeader wellness={wellness} streak={streak} />
      <MilestoneStrip milestones={milestones} />
    </section>
  );
}

function ProgressHeader({ wellness, streak }: { wellness: GardenWellness; streak: number }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
          Your progress
        </p>
        <h2 className="mt-1 text-lg font-semibold text-emerald-950 font-display">
          {wellness.headline}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-700">{wellness.detail}</p>
        <p className="mt-2 text-xs text-violet-800/80">
          Optional milestones — care still works the same without them.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-100">
          <span aria-hidden>🌿</span>
          {wellness.label} · {wellness.score}
        </span>
        {streak > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-950">
            <span aria-hidden>✨</span>
            {streak}-day rhythm
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MilestoneStrip({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return null;

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {milestones.map((milestone) => (
        <article
          key={milestone.id}
          className={`min-w-[10.5rem] shrink-0 rounded-2xl border px-3 py-3 ${
            milestone.unlocked
              ? 'border-emerald-200 bg-white text-emerald-950'
              : 'border-dashed border-violet-200 bg-violet-50/60 text-violet-950'
          }`}
          title={milestone.description}
        >
          <p className="text-lg" aria-hidden>
            {milestone.emoji}
          </p>
          <p className="mt-1 text-sm font-semibold">{milestone.title}</p>
          <p className="mt-0.5 text-xs opacity-80">
            {milestone.unlocked
              ? 'Unlocked'
              : milestone.progressLabel ?? 'Keep going gently'}
          </p>
        </article>
      ))}
    </div>
  );
}
