import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  defaultSpeciesDiscoveryFilters,
  SPECIES_BROWSE_SORT_OPTIONS,
  SPECIES_DISCOVERY_FILTERS,
  type SpeciesBrowseSort,
  type SpeciesDiscoveryFilterKey,
} from '../constants/speciesDiscovery';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { speciesApi } from '../services/api';
import { resolveApiThumbnailUrl } from '../utils/apiAssets';
import { formatApiErrorMessage } from '../utils/apiError';

interface SpeciesItem {
  id: string;
  commonName: string;
  scientificName?: string;
  sunlight?: string;
  wateringFreqDays?: number;
  toxicity?: string;
  defaultImageUrl?: string;
  discoveryTags?: string[];
  difficulty?: string;
  toxicitySummary?: string;
  matchReasons?: string[];
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

function sortFromParams(params: URLSearchParams): SpeciesBrowseSort {
  const sort = params.get('sort');
  if (sort === 'waterAsc' || sort === 'waterDesc' || sort === 'difficulty') return sort;
  return 'name';
}

export default function BrowsePlants() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [activeFilters, setActiveFilters] = useState(() => filtersFromParams(searchParams));
  const [sort, setSort] = useState<SpeciesBrowseSort>(() => sortFromParams(searchParams));
  const [result, setResult] = useState<BrowseResponse | null>(null);
  const [recommended, setRecommended] = useState<{
    items: SpeciesItem[];
    reason: string;
  } | null>(null);
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
    speciesApi
      .recommended(8)
      .then((r) => {
        if (!cancelled) setRecommended(r.data);
      })
      .catch(() => {
        if (!cancelled) setRecommended(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    speciesApi
      .browse({
        q: debouncedQuery,
        page,
        pageSize: PAGE_SIZE,
        sort: sort !== 'name' ? sort : undefined,
        ...filterParams,
      })
      .then((r) => {
        if (!cancelled) setResult(r.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(formatApiErrorMessage(err, 'Could not load plants. Try again in a moment.'));
          setResult(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, page, filterParams, sort]);

  const syncUrl = (
    nextPage: number,
    q: string,
    filters: Record<SpeciesDiscoveryFilterKey, boolean>,
    nextSort: SpeciesBrowseSort = sort,
  ) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (nextPage > 1) params.set('page', String(nextPage));
    if (nextSort !== 'name') params.set('sort', nextSort);
    for (const [key, value] of Object.entries(filtersToParams(filters))) {
      params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  const applyFilters = (filters: Record<SpeciesDiscoveryFilterKey, boolean>) => {
    setActiveFilters(filters);
    syncUrl(1, debouncedQuery, filters);
  };

  const applySort = (nextSort: SpeciesBrowseSort) => {
    setSort(nextSort);
    syncUrl(1, debouncedQuery, activeFilters, nextSort);
  };

  const clearFilters = () => {
    const cleared = { ...defaultSpeciesDiscoveryFilters };
    setActiveFilters(cleared);
    syncUrl(1, debouncedQuery, cleared);
  };

  const hasActiveFilters = Object.values(activeFilters).some(Boolean);

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
    <div className="space-y-5">
      <PageHeader
        eyebrow="Plant catalog"
        title="Browse plants"
        description={
          total > 0 && !loading
            ? `Explore ${total} species. Filter, search, then add any plant to your garden.`
            : 'Explore our catalog. Filter, search, then add any plant to your garden.'
        }
        help="browse-species"
        action={
          <Link to="/garden/plants/new">
            <Button>Add plant</Button>
          </Link>
        }
      />

      {recommended?.items?.length ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-emerald-900">Recommended for you</h2>
            <p className="text-xs text-gray-500">{recommended.reason}</p>
          </div>
          <ul className="-mx-1 flex gap-3 overflow-x-auto pb-1 px-1 snap-x snap-mandatory">
            {recommended.items.map((species) => (
              <li key={species.id} className="w-44 shrink-0 snap-start">
                <article className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                  <Link
                    to={`/garden/plants/browse/${species.id}`}
                    className="block aspect-square bg-emerald-50"
                  >
                    {species.defaultImageUrl ? (
                      <img
                        src={resolveApiThumbnailUrl(species.defaultImageUrl, 320) ?? undefined}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center px-3 text-center text-xs font-semibold text-emerald-700">
                        Photo coming
                      </span>
                    )}
                  </Link>
                  <div className="p-2.5">
                    <Link
                      to={`/garden/plants/browse/${species.id}`}
                      className="line-clamp-2 text-xs font-semibold text-emerald-950 hover:text-emerald-700"
                    >
                      {species.commonName}
                    </Link>
                    {species.difficulty ? (
                      <p className="mt-1 text-[0.65rem] font-medium text-lime-800">
                        {species.difficulty}
                      </p>
                    ) : null}
                    {species.matchReasons?.length ? (
                      <ul className="mt-1.5 flex flex-wrap gap-1">
                        {species.matchReasons.slice(0, 2).map((reason) => (
                          <li
                            key={reason}
                            className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[0.6rem] font-medium text-emerald-800 ring-1 ring-emerald-100"
                          >
                            {reason}
                          </li>
                        ))}
                        {species.matchReasons.length > 2 ? (
                          <li
                            className="rounded-full bg-gray-50 px-1.5 py-0.5 text-[0.6rem] font-medium text-gray-600 ring-1 ring-gray-100"
                            aria-label={`${species.matchReasons.length - 2} more recommendation reasons`}
                          >
                            +{species.matchReasons.length - 2}
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-xs font-semibold text-emerald-700 hover:underline"
            >
              Clear all filters
            </button>
          ) : null}
        </div>

        <div>
          <label htmlFor="browse-sort" className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Sort by
          </label>
          <select
            id="browse-sort"
            value={sort}
            onChange={(e) => applySort(e.target.value as SpeciesBrowseSort)}
            className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:w-auto"
          >
            {SPECIES_BROWSE_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && total > 0 && (
        <p className="text-sm text-gray-500">
          Showing {rangeStart}–{rangeEnd} of {total}
        </p>
      )}

      {loading ? (
        <SkeletonGrid count={6} />
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-white border border-emerald-100 px-5 py-8 text-center text-sm text-gray-500">
          <p className="font-semibold text-emerald-950">No plants match your search yet.</p>
          <p className="mt-1">
            Try clearing filters, using a shorter common name, or identifying from a photo.
          </p>
          <Link
            to="/garden/plants/new"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
          >
            Identify from a photo
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4">
          {items.map((species) => (
            <li key={species.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
                <Link
                  to={`/garden/plants/browse/${species.id}`}
                  className="aspect-[4/3] bg-emerald-50 flex items-center justify-center overflow-hidden"
                >
                  {species.defaultImageUrl ? (
                    <img
                      src={resolveApiThumbnailUrl(species.defaultImageUrl, 320) ?? undefined}
                      alt={species.commonName}
                      title={species.scientificName || species.commonName}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="px-3 text-center text-sm font-semibold text-emerald-700">
                      No photo yet
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <Link
                    to={`/garden/plants/browse/${species.id}`}
                    className="line-clamp-2 font-semibold text-emerald-950 leading-snug hover:text-emerald-700"
                  >
                    {species.commonName}
                  </Link>
                  {species.scientificName ? (
                    <p className="mt-0.5 line-clamp-1 text-sm italic text-gray-400">
                      {species.scientificName}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-gray-500">
                    {species.sunlight || 'Light not specified'} - Water every{' '}
                    {species.wateringFreqDays ?? 7} days
                  </p>
                  {(species.difficulty || species.toxicitySummary) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {species.difficulty ? (
                        <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[0.65rem] font-semibold text-lime-900">
                          {species.difficulty}
                        </span>
                      ) : null}
                      {species.toxicitySummary ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
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
                    </div>
                  )}
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
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link
                      to={`/garden/plants/browse/${species.id}`}
                      className="flex-1 rounded-2xl border border-emerald-200 py-2.5 text-center text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/garden/plants/new?speciesId=${encodeURIComponent(species.id)}`)
                      }
                      className="flex-1 rounded-2xl bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                    >
                      Add
                    </button>
                  </div>
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
