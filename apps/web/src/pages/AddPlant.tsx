import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANT_LOCATIONS } from '../constants/plantLocations';
import { plantsApi, speciesApi } from '../services/api';
import { trackEvent } from '../utils/analytics';

interface Species {
  id: string;
  commonName: string;
  scientificName?: string;
  sunlight?: string;
  wateringFreqDays?: number;
  toxicity?: string;
  discoveryTags?: string[];
}

const discoveryFilters = [
  { key: 'petSafe', label: 'Pet-safe' },
  { key: 'lowLight', label: 'Low light' },
  { key: 'edible', label: 'Edible' },
  { key: 'droughtTolerant', label: 'Drought-tolerant' },
  { key: 'indoor', label: 'Indoor' },
  { key: 'outdoor', label: 'Outdoor' },
] as const;

type DiscoveryFilterKey = (typeof discoveryFilters)[number]['key'];

const defaultFilters: Record<DiscoveryFilterKey, boolean> = {
  petSafe: false,
  lowLight: false,
  edible: false,
  droughtTolerant: false,
  indoor: false,
  outdoor: false,
};

export default function AddPlant() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [speciesId, setSpeciesId] = useState('');
  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState(PLANT_LOCATIONS[0]);
  const [potSize, setPotSize] = useState('MEDIUM');
  const [datePlanted, setDatePlanted] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [activeFilters, setActiveFilters] =
    useState<Record<DiscoveryFilterKey, boolean>>(defaultFilters);

  useEffect(() => {
    const hasFilters = Object.values(activeFilters).some(Boolean);
    if (query.length < 2 && !hasFilters) {
      setSpeciesList([]);
      return;
    }
    const t = setTimeout(() => {
      speciesApi.search(query, activeFilters).then((r) => setSpeciesList(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [activeFilters, query]);

  const handleIdentify = async (file: File) => {
    setIdentifying(true);
    setError('');
    try {
      const { data } = await plantsApi.identify(file);
      setSpeciesId(data.species.id);
      setQuery(data.species.commonName);
      if (data.confidence) setNickname(`${data.commonName} (${Math.round(data.confidence * 100)}%)`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Could not identify plant');
    } finally {
      setIdentifying(false);
    }
  };

  const handlePhoto = async (file: File) => {
    const { data } = await plantsApi.upload(file);
    setImageUrl(data.url);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!speciesId) {
      setError('Select a species');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await plantsApi.create({
        speciesId,
        nickname: nickname || undefined,
        location,
        potSize,
        datePlanted: datePlanted || undefined,
        imageUrl: imageUrl || undefined,
      });
      trackEvent('PlantAdded', { speciesId });
      navigate(`/garden/plants/${data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to add plant');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSpeciesId('');
    setQuery('');
    setSpeciesList([]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24 md:pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Grow your garden
        </p>
        <h1 className="text-3xl font-bold text-emerald-950 font-display">Add a plant</h1>
        <p className="mt-1 text-sm text-gray-600">
          Search by name or use discovery filters to browse plants that fit your home and goals.
        </p>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-emerald-100 p-5 sm:p-6 space-y-5 shadow-sm shadow-emerald-900/5"
      >
        <section className="space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="species-search">
            Species
          </label>
          <input
            id="species-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSpeciesId('');
            }}
            placeholder="Search plants..."
            className="w-full border border-emerald-100 rounded-2xl px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Discovery filters
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {discoveryFilters.map((filter) => {
                const active = activeFilters[filter.key];
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() =>
                      setActiveFilters((current) => ({
                        ...current,
                        [filter.key]: !current[filter.key],
                      }))
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

          {speciesList.length > 0 && !speciesId && (
            <ul className="space-y-2 max-h-80 overflow-auto">
              {speciesList.map((species) => (
                <li key={species.id}>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                    onClick={() => {
                      setSpeciesId(species.id);
                      setQuery(species.commonName);
                      setSpeciesList([]);
                    }}
                  >
                    <span className="font-semibold text-emerald-950">{species.commonName}</span>
                    {species.scientificName ? (
                      <span className="ml-2 text-gray-400 italic">{species.scientificName}</span>
                    ) : null}
                    <span className="mt-1 block text-xs text-gray-500">
                      {species.sunlight || 'Light not specified'} · Water every{' '}
                      {species.wateringFreqDays ?? 7} days
                    </span>
                    {species.discoveryTags?.length ? (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {species.discoveryTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-emerald-50 px-2 py-1 text-[0.65rem] font-semibold text-emerald-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    {species.toxicity ? (
                      <span className="mt-1 block text-xs text-gray-500">{species.toxicity}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {(query.length >= 2 || Object.values(activeFilters).some(Boolean)) &&
            speciesList.length === 0 &&
            !speciesId && (
              <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
                No plants found yet. Try fewer filters or a broader name.
              </p>
            )}

          {speciesId && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Selected: {query}
              <button type="button" onClick={clearSelection} className="ml-2 text-xs underline">
                Change
              </button>
            </p>
          )}
        </section>

        <section>
          <label className="block text-sm font-medium text-gray-700 mb-1">Identify from photo</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={identifying}
            onChange={(e) => e.target.files?.[0] && handleIdentify(e.target.files[0])}
            className="text-sm"
          />
          {identifying && <p className="text-sm text-emerald-600 mt-1">Identifying...</p>}
        </section>

        <input
          placeholder="Nickname (optional)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full border border-emerald-100 rounded-2xl px-4 py-3 text-sm"
        />

        <section>
          <label className="block text-sm font-medium text-gray-700 mb-1">Where it grows</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-emerald-100 rounded-2xl px-4 py-3 text-sm"
          >
            {PLANT_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Outdoor and garden locations skip indoor misting reminders.
          </p>
        </section>

        <select
          value={potSize}
          onChange={(e) => setPotSize(e.target.value)}
          className="w-full border border-emerald-100 rounded-2xl px-4 py-3 text-sm"
        >
          <option value="SMALL">Small pot</option>
          <option value="MEDIUM">Medium pot</option>
          <option value="LARGE">Large pot</option>
        </select>

        <input
          type="date"
          value={datePlanted}
          onChange={(e) => setDatePlanted(e.target.value)}
          className="w-full border border-emerald-100 rounded-2xl px-4 py-3 text-sm"
        />

        <section>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plant photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
            className="text-sm"
          />
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-800 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-900 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save plant'}
        </button>
      </form>
    </div>
  );
}
