import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { speciesApi } from '../services/api';

interface SpeciesDetail {
  id: string;
  commonName: string;
  scientificName?: string;
  sunlight?: string;
  wateringFreqDays?: number;
  toxicity?: string;
  careNotes?: string;
  defaultImageUrl?: string;
  discoveryTags?: string[];
  difficulty?: string;
  toxicitySummary?: string;
  phRangeLabel?: string;
}

export default function SpeciesBrowseDetail() {
  const { speciesId } = useParams<{ speciesId: string }>();
  const navigate = useNavigate();
  const [species, setSpecies] = useState<SpeciesDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    speciesApi
      .get(id)
      .then(({ data }) => {
        if (!cancelled) setSpecies(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this species.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [speciesId]);

  if (loading) {
    return <p className="py-12 text-center text-gray-500">Loading…</p>;
  }

  if (error || !species) {
    return (
      <div className="space-y-4 pb-24">
        <p className="text-red-600">{error || 'Species not found.'}</p>
        <Link to="/garden/plants/browse" className="text-emerald-700 hover:underline">
          ← Back to browse
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-24">
      <Link to="/garden/plants/browse" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Browse plants
      </Link>

      <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <div className="aspect-[16/10] bg-emerald-50">
          {species.defaultImageUrl ? (
            <img
              src={species.defaultImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl" aria-hidden>
              🌿
            </div>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-emerald-950">{species.commonName}</h1>
            {species.scientificName ? (
              <p className="mt-1 text-sm italic text-gray-500">{species.scientificName}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {species.difficulty ? (
              <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-900">
                {species.difficulty}
              </span>
            ) : null}
            {species.toxicitySummary ? (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  species.toxicitySummary === 'Pet-safe'
                    ? 'bg-emerald-100 text-emerald-900'
                    : species.toxicitySummary === 'Toxic'
                      ? 'bg-amber-100 text-amber-950'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {species.toxicitySummary}
              </span>
            ) : null}
            {species.discoveryTags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
              >
                {tag}
              </span>
            ))}
          </div>

          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-emerald-900">Light</dt>
              <dd className="text-gray-700">{species.sunlight || 'Not specified'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-900">Watering cadence</dt>
              <dd className="text-gray-700">About every {species.wateringFreqDays ?? 7} days</dd>
            </div>
            {species.phRangeLabel ? (
              <div>
                <dt className="font-semibold text-emerald-900">Soil pH</dt>
                <dd className="text-gray-700">{species.phRangeLabel}</dd>
              </div>
            ) : null}
            {species.toxicity ? (
              <div>
                <dt className="font-semibold text-emerald-900">Toxicity</dt>
                <dd className="text-gray-700">{species.toxicity}</dd>
              </div>
            ) : null}
          </dl>

          {species.careNotes ? (
            <p className="rounded-2xl bg-emerald-50/80 p-4 text-sm leading-6 text-gray-700">
              {species.careNotes}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => navigate(`/garden/plants/new?speciesId=${encodeURIComponent(species.id)}`)}
            className="w-full rounded-2xl bg-emerald-800 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Add to my garden
          </button>
        </div>
      </article>
    </div>
  );
}
