import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  defaultSpeciesDiscoveryFilters,
  SPECIES_DISCOVERY_FILTERS,
  type SpeciesDiscoveryFilterKey,
} from '../constants/speciesDiscovery';
import { speciesApi } from '../services/api';

interface SpeciesItem {
  id: string;
  commonName: string;
  scientificName?: string;
  sunlight?: string;
  wateringFreqDays?: number;
  toxicity?: string;
  defaultImageUrl?: string;
  discoveryTags?: string[];
}

interface BrowseResponse {
  items: SpeciesItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 24;

function filtersFromParams(params: URLSearchParams): Record<SpeciesDiscoveryFilterKey, boolean> {
  const next = { ...defaultSpeciesDiscoveryFilters };
  for (const { key } of SPECIES_DISCOVERY_FILTERS) {
    next[key] = params.get(key) === 'true';
  }
  return next;
}

function filtersToParams(
  filters: Record<SpeciesDiscoveryFilterKey, boolean>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key } of SPECIES_DISCOVERY_FILTERS) {
    if (filters[key]) out[key] = 'true';
  }
  return out;
}

export default function BrowsePlants() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [activeFilters, setActiveFilters] = useState(() => filtersFromParams(searchParams));
  const [result, setResult] = useState<BrowseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filterParams = useMemo(() => filtersToParams(activeFilters), [activeFilters]);

  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    if (debouncedQuery !== urlQ) {
      syncUrl(1, debouncedQuery, activeFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync URL when debounced search changes
  }, [debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    speciesApi
      .browse({
        q: debouncedQuery,
        page,
        pageSize: PAGE_SIZE,
        ...filterParams,
      })
      .then((r) => {
        if (!cancelled) setResult(r.data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load plants. Try again in a moment.');
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page, filterParams]);

  const syncUrl = (nextPage: number, q: string, filters: Record<SpeciesDiscoveryFilterKey, boolean>) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (nextPage > 1) params.set('page', String(nextPage));
    for (const [key, value] of Object.entries(filtersToParams(filters))) {
      params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  const applyFilters = (filters: Record<SpeciesDiscoveryFilterKey, boolean>) => {
    setActiveFilters(filters);
    syncUrl(1, debouncedQuery, filters);
  };

  const goToPage = (nextPage: number) => {
    syncUrl(nextPage, debouncedQuery, activeFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    syncUrl(1, query.trim(), activeFilters);
    setDebouncedQuery(query.trim());
  };

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="pb-24 md:pb-8 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Plant catalog
          </p>
          <h1 className="text-3xl font-bold text-emerald-950 font-display">Browse plants</h1>
          <p className="mt-1 text-sm text-gray-600">
            Explore {total > 0 && !loading ? `${total} species` : 'our catalog'} — filter, search,
            then add any plant to your garden.
          </p>
        </div>
        <Link
          to="/garden/plants/new"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Add plant
        </Link>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="rounded-3xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm shadow-emerald-900/5 space-y-3"
      >
        <label className="block text-sm font-medium text-gray-700" htmlFor="browse-search">
          Search
        </label>
        <div className="flex gap-2">
          <input
            id="browse-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or scientific name..."
            className="min-w-0 flex-1 border border-emerald-100 rounded-2xl px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Search
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Filters</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SPECIES_DISCOVERY_FILTERS.map((filter) => {
              const active = activeFilters[filter.key];
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() =>
                    applyFilters({
                      ...activeFilters,
                      [filter.key]: !active,
                    })
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && total > 0 && (
        <p className="text-sm text-gray-500">
          Showing {rangeStart}–{rangeEnd} of {total}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-emerald-700">Loading plants…</p>
      ) : items.length === 0 ? (
        <p className="rounded-3xl bg-white border border-emerald-100 px-5 py-8 text-center text-sm text-gray-500">
          No plants match your search. Try clearing filters or a shorter name.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((species) => (
            <li key={species.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
                <div className="aspect-[4/3] bg-emerald-50 flex items-center justify-center overflow-hidden">
                  {species.defaultImageUrl ? (
                    <img
                      src={species.defaultImageUrl}
                      alt={species.commonName}
                      title={species.scientificName || species.commonName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-5xl" aria-hidden>
                      🌿
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="font-semibold text-emerald-950 leading-snug">
                    {species.commonName}
                  </h2>
                  {species.scientificName ? (
                    <p className="mt-0.5 text-sm italic text-gray-400">{species.scientificName}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-gray-500">
                    {species.sunlight || 'Light not specified'} · Water every{' '}
                    {species.wateringFreqDays ?? 7} days
                  </p>
                  {species.discoveryTags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {species.discoveryTags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/garden/plants/new?speciesId=${encodeURIComponent(species.id)}`)
                    }
                    className="mt-4 w-full rounded-2xl bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    Add to garden
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {!loading && totalPages > 1 && (
        <nav
          className="flex flex-wrap items-center justify-center gap-2 pt-2"
          aria-label="Pagination"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            className="rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-emerald-900 disabled:opacity-40 hover:bg-emerald-50"
          >
            Previous
          </button>
          <span className="px-2 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            className="rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-emerald-900 disabled:opacity-40 hover:bg-emerald-50"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}