export interface SpeciesMetadata {
  pests?: string[];
  diseases?: string[];
  hardinessZones?: string[];
  humidity?: 'low' | 'medium' | 'high';
  tempMinF?: number;
  tempMaxF?: number;
  growthRate?: 'slow' | 'medium' | 'fast';
  matureSize?: string;
  bloomSeason?: string;
  dormancySeason?: string;
  propagation?: string[];
  soilType?: string;
  pollinatorFriendly?: boolean;
  bloomsIndoors?: boolean;
}

function humidityLabel(level?: SpeciesMetadata['humidity']) {
  if (level === 'low') return 'Low';
  if (level === 'high') return 'High';
  if (level === 'medium') return 'Medium';
  return null;
}

function growthLabel(rate?: SpeciesMetadata['growthRate']) {
  if (!rate) return null;
  return rate.charAt(0).toUpperCase() + rate.slice(1);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-emerald-950">{value}</p>
    </div>
  );
}

function TagList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'amber' | 'rose' | 'violet';
}) {
  const chip =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-950'
      : tone === 'rose'
        ? 'bg-rose-100 text-rose-950'
        : 'bg-violet-100 text-violet-950';
  return (
    <div>
      <p className="text-xs font-semibold text-emerald-800">{title}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold ${chip}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SpeciesMetadataPanel({ metadata }: { metadata: SpeciesMetadata }) {
  const humidity = humidityLabel(metadata.humidity);
  const growth = growthLabel(metadata.growthRate);
  const hasClimate =
    humidity ||
    metadata.tempMinF != null ||
    metadata.tempMaxF != null ||
    metadata.hardinessZones?.length;
  const hasLists =
    (metadata.pests?.length ?? 0) > 0 ||
    (metadata.diseases?.length ?? 0) > 0 ||
    metadata.matureSize ||
    growth ||
    metadata.bloomSeason ||
    metadata.dormancySeason ||
    metadata.soilType ||
    (metadata.propagation?.length ?? 0) > 0;

  if (!hasClimate && !hasLists) return null;

  return (
    <section className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
      <h2 className="text-sm font-semibold text-emerald-900">Growing profile</h2>

      {metadata.pollinatorFriendly ? (
        <p className="rounded-xl bg-violet-100/80 px-3 py-2 text-xs font-medium text-violet-950">
          Pollinator-friendly — great for outdoor beds and kitchen gardens.
        </p>
      ) : null}

      {hasClimate ? (
        <div className="grid grid-cols-2 gap-2">
          {humidity ? <StatCard label="Humidity" value={humidity} /> : null}
          {metadata.tempMinF != null && metadata.tempMaxF != null ? (
            <StatCard
              label="Temperature"
              value={`${metadata.tempMinF}–${metadata.tempMaxF}°F`}
            />
          ) : null}
          {metadata.hardinessZones?.length ? (
            <div className="col-span-2 rounded-xl bg-white/80 px-3 py-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">
                USDA hardiness zones
              </p>
              <p className="mt-0.5 text-sm font-medium text-emerald-950">
                {metadata.hardinessZones.join(', ')}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {(metadata.bloomSeason || metadata.dormancySeason || metadata.soilType) && (
        <dl className="grid gap-2 text-sm">
          {metadata.bloomSeason ? (
            <div>
              <dt className="font-semibold text-emerald-900">Bloom season</dt>
              <dd className="text-gray-700">{metadata.bloomSeason}</dd>
            </div>
          ) : null}
          {metadata.dormancySeason ? (
            <div>
              <dt className="font-semibold text-emerald-900">Dormancy</dt>
              <dd className="text-gray-700">{metadata.dormancySeason}</dd>
            </div>
          ) : null}
          {metadata.soilType ? (
            <div>
              <dt className="font-semibold text-emerald-900">Soil</dt>
              <dd className="text-gray-700">{metadata.soilType}</dd>
            </div>
          ) : null}
        </dl>
      )}

      {metadata.pests?.length ? (
        <TagList title="Common pests" items={metadata.pests} tone="amber" />
      ) : null}
      {metadata.diseases?.length ? (
        <TagList title="Common diseases" items={metadata.diseases} tone="rose" />
      ) : null}
      {metadata.propagation?.length ? (
        <TagList title="Propagation" items={metadata.propagation} tone="violet" />
      ) : null}

      {(growth || metadata.matureSize) && (
        <dl className="grid gap-2 text-sm">
          {growth ? (
            <div>
              <dt className="font-semibold text-emerald-900">Growth rate</dt>
              <dd className="text-gray-700">{growth}</dd>
            </div>
          ) : null}
          {metadata.matureSize ? (
            <div>
              <dt className="font-semibold text-emerald-900">Mature size</dt>
              <dd className="text-gray-700">{metadata.matureSize}</dd>
            </div>
          ) : null}
        </dl>
      )}
    </section>
  );
}
