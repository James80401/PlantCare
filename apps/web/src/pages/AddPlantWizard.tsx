import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PhotoCaptureZone } from '../components/plants/PhotoCaptureZone';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { PLANT_LOCATIONS } from '../constants/plantLocations';
import {
  defaultSpeciesDiscoveryFilters,
  SPECIES_DISCOVERY_FILTERS,
  type SpeciesDiscoveryFilterKey,
} from '../constants/speciesDiscovery';
import { plantsApi, speciesApi, gardensApi, type GardenSummaryCard } from '../services/api';
import { CreateGardenForm } from '../components/gardens/CreateGardenForm';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';
import { resolveApiAssetUrl } from '../utils/apiAssets';

interface Species {
  id: string;
  commonName: string;
  scientificName?: string;
  sunlight?: string;
  wateringFreqDays?: number;
  toxicity?: string;
  discoveryTags?: string[];
  defaultImageUrl?: string;
}

type Step = 'photo' | 'confirm' | 'search' | 'details';

export default function AddPlantWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>('photo');

  // Garden-first: a plant must be added into a garden. Resolve the target garden from
  // the ?gardenId= param (when arriving from a Garden Dashboard) or default to the
  // user's first garden. If the user has none, gate the wizard behind garden creation.
  const [gardens, setGardens] = useState<GardenSummaryCard[]>([]);
  const [gardensLoaded, setGardensLoaded] = useState(false);
  const [selectedGardenId, setSelectedGardenId] = useState('');

  useEffect(() => {
    gardensApi
      .summaries()
      .then(({ data }) => {
        setGardens(data);
        const fromParam = searchParams.get('gardenId');
        const initial =
          (fromParam && data.some((g) => g.id === fromParam) ? fromParam : '') ||
          data[0]?.id ||
          '';
        setSelectedGardenId(initial);
      })
      .catch(() => setGardens([]))
      .finally(() => setGardensLoaded(true));
  }, [searchParams]);

  const [query, setQuery] = useState('');
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [speciesId, setSpeciesId] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [identifyConfidence, setIdentifyConfidence] = useState<number | null>(null);

  const [nickname, setNickname] = useState('');
  const [location, setLocation] = useState(PLANT_LOCATIONS[0]);
  const [potSize, setPotSize] = useState('MEDIUM');
  const [datePlanted, setDatePlanted] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [identifyPreview, setIdentifyPreview] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [limitError, setLimitError] = useState<{ message: string; code: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [activeFilters, setActiveFilters] =
    useState<Record<SpeciesDiscoveryFilterKey, boolean>>(defaultSpeciesDiscoveryFilters);

  const defaultLightLevel = user?.defaultLightLevel || 'medium';

  useEffect(() => {
    // Surface default light preference by pre-selecting a matching discovery filter.
    setActiveFilters((current) => {
      const next = { ...current };
      if (defaultLightLevel === 'low') next.lowLight = true;
      return next;
    });
  }, [defaultLightLevel]);

  useEffect(() => {
    const preselectedId = searchParams.get('speciesId');
    if (!preselectedId) return;
    let cancelled = false;
    speciesApi.get(preselectedId).then((r) => {
      if (cancelled) return;
      const species = r.data as Species;
      setSpeciesId(species.id);
      setSelectedSpecies(species);
      setQuery(species.commonName);
      setStep('details');
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (step !== 'search') return;
    const hasFilters = Object.values(activeFilters).some(Boolean);
    if (query.length < 2 && !hasFilters) {
      setSpeciesList([]);
      return;
    }
    const t = setTimeout(() => {
      speciesApi.search(query, activeFilters).then((r) => setSpeciesList(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [activeFilters, query, step]);

  useEffect(() => {
    return () => {
      if (identifyPreview?.startsWith('blob:')) URL.revokeObjectURL(identifyPreview);
    };
  }, [identifyPreview]);

  const selectSpecies = (species: Species) => {
    setSpeciesId(species.id);
    setSelectedSpecies(species);
    setQuery(species.commonName);
    setSpeciesList([]);
    setStep('details');
  };

  const handleIdentify = async (file: File) => {
    if (identifyPreview?.startsWith('blob:')) URL.revokeObjectURL(identifyPreview);
    setIdentifyPreview(URL.createObjectURL(file));
    setIdentifying(true);
    setError('');
    setLimitError(null);
    try {
      const { data } = await plantsApi.identify(file);
      const species = data.species as Species;
      setSpeciesId(species.id);
      setSelectedSpecies(species);
      setQuery(species.commonName);
      setIdentifyConfidence(
        typeof data.confidence === 'number' ? Math.round(data.confidence * 100) : null,
      );
      setStep('confirm');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      if (data?.code === 'IDENTIFY_LIMIT_REACHED') {
        setLimitError({ code: data.code, message: data.message || 'Identification limit reached.' });
      }
      const msg = data?.message;
      setError(msg || 'Could not identify plant. Try search or browse instead.');
    } finally {
      setIdentifying(false);
    }
  };

  const handlePlantPhoto = async (file: File) => {
    try {
      const { data } = await plantsApi.upload(file);
      setImageUrl(data.url);
    } catch {
      setError('Could not upload photo.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!speciesId) {
      setError('Select a species to continue.');
      return;
    }
    if (!selectedGardenId) {
      setError('Choose a garden for this plant.');
      return;
    }
    setLoading(true);
    setError('');
    setLimitError(null);
    try {
      await plantsApi.create({
        gardenId: selectedGardenId,
        speciesId,
        nickname: nickname || undefined,
        location,
        potSize,
        datePlanted: datePlanted || undefined,
        notes: notes.trim() || undefined,
        imageUrl: imageUrl || undefined,
      });
      trackEvent('PlantAdded', { speciesId });
      navigate(`/garden/gardens/${selectedGardenId}`);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; code?: string } } })?.response?.data;
      if (data?.code === 'PLANT_LIMIT_REACHED') {
        setLimitError({ code: data.code, message: data.message || 'Plant limit reached.' });
      }
      const msg = data?.message;
      setError(msg || 'Failed to add plant');
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = useMemo(() => {
    switch (step) {
      case 'photo':
        return 'Identify or search';
      case 'confirm':
        return 'Is this your plant?';
      case 'search':
        return 'Find your plant';
      case 'details':
        return 'Plant details';
      default:
        return 'Add a plant';
    }
  }, [step]);

  const lightPreferenceLabel =
    defaultLightLevel === 'low'
      ? 'Low light'
      : defaultLightLevel === 'high'
        ? 'Bright light'
        : 'Medium light';

  const lightFitLabel = useMemo(() => {
    if (!selectedSpecies?.sunlight) return null;
    const sunlight = selectedSpecies.sunlight.toLowerCase();
    if (defaultLightLevel === 'low') {
      return sunlight.includes('low')
        ? 'Good fit for your low-light setup.'
        : 'May need a brighter spot than your default setup.';
    }
    if (defaultLightLevel === 'high') {
      return sunlight.includes('bright') || sunlight.includes('full sun')
        ? 'Good fit for your bright-light setup.'
        : 'Can work in bright spaces, but avoid harsh direct sun if noted.';
    }
    return sunlight.includes('medium') || sunlight.includes('indirect')
      ? 'Good fit for your medium-light setup.'
      : 'Check this plant’s light notes against your space.';
  }, [defaultLightLevel, selectedSpecies?.sunlight]);

  // Garden-first gate: a plant must live in a garden. If the user has none, prompt them
  // to create one before any plant steps.
  if (gardensLoaded && gardens.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <PageHeader
          eyebrow="Grow your garden"
          title="Create a garden first"
          description="Plants live inside gardens — shared spaces you and others can tend together. Create your first garden to start adding plants."
        />
        <Card className="space-y-3">
          <CreateGardenForm
            submitLabel="Create garden & continue"
            onCreated={(g) => {
              setGardens((prev) => [
                {
                  id: g.id,
                  name: g.name,
                  location: g.location ?? null,
                  isOwner: true,
                  plantCount: 0,
                  memberCount: 1,
                  tasksDueToday: 0,
                  overdue: 0,
                  urgentAlerts: 0,
                  status: 'No plants yet',
                },
                ...prev,
              ]);
              setSelectedGardenId(g.id);
            }}
          />
        </Card>
      </div>
    );
  }

  const selectedGarden = gardens.find((g) => g.id === selectedGardenId);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Grow your garden"
        title="Add a plant"
        description={stepTitle}
      />
      {gardens.length > 0 ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-emerald-900">Add to garden</span>
          <select
            value={selectedGardenId}
            onChange={(e) => setSelectedGardenId(e.target.value)}
            className="rounded-2xl border border-emerald-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none"
          >
            {gardens.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.location ? ` · ${g.location}` : ''}
                {g.isOwner ? '' : ' (shared)'}
              </option>
            ))}
          </select>
          {selectedGarden && !selectedGarden.isOwner ? (
            <span className="text-xs text-violet-700">
              You're a caretaker of this shared garden.
            </span>
          ) : null}
        </label>
      ) : null}
      <p className="text-xs text-gray-600">
        Typical light from Settings: <span className="font-semibold text-emerald-900">{lightPreferenceLabel}</span>{' '}
        · used to guide discovery and care fit.
      </p>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {limitError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">{limitError.message}</p>
          <Link to="/garden/subscription" className="mt-2 inline-block font-semibold text-emerald-800 hover:underline">
            View Premium options
          </Link>
        </div>
      ) : null}

      {step === 'photo' && (
        <Card className="space-y-4">
          <PhotoCaptureZone
            label="Take or upload a photo"
            hint="We’ll suggest a species from the image"
            busy={identifying}
            previewUrl={identifyPreview}
            onFile={handleIdentify}
          />
          <Button variant="secondary" fullWidth onClick={() => setStep('search')}>
            Search by name instead
          </Button>
          <Link
            to="/garden/plants/browse"
            className="block text-center text-sm font-semibold text-emerald-800 hover:underline"
          >
            Browse the full catalog
          </Link>
        </Card>
      )}

      {step === 'confirm' && selectedSpecies && (
        <Card className="space-y-4">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
              {selectedSpecies.defaultImageUrl ? (
                <img
                  src={resolveApiAssetUrl(selectedSpecies.defaultImageUrl) ?? undefined}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : identifyPreview ? (
                <img src={identifyPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl">🌿</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold text-emerald-950">
                {selectedSpecies.commonName}
              </p>
              {selectedSpecies.scientificName ? (
                <p className="text-sm italic text-gray-500">{selectedSpecies.scientificName}</p>
              ) : null}
              {identifyConfidence != null ? (
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-medium text-gray-600">
                    <span>Match confidence</span>
                    <span>{identifyConfidence}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{ width: `${Math.min(100, identifyConfidence)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <Button fullWidth onClick={() => setStep('details')}>
            Yes, add this plant
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setStep('search')}>
            Not quite — search manually
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setStep('photo')}>
            Try another photo
          </Button>
        </Card>
      )}

      {step === 'search' && (
        <Card className="space-y-4">
          <Input
            label="Species name"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSpeciesId('');
              setSelectedSpecies(null);
            }}
            placeholder="e.g. Monstera, Basil, Snake plant"
          />
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
            {defaultLightLevel === 'low' ? (
              <p className="mt-2 text-xs text-gray-500">
                Low-light filter is preselected from your care preferences.
              </p>
            ) : null}
          </div>
          {speciesList.length > 0 && (
            <ul className="max-h-72 space-y-2 overflow-auto">
              {speciesList.map((species) => (
                <li key={species.id}>
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-left text-sm hover:bg-emerald-50"
                    onClick={() => selectSpecies(species)}
                  >
                    <span className="font-semibold text-emerald-950">{species.commonName}</span>
                    {species.scientificName ? (
                      <span className="ml-2 text-gray-400 italic">{species.scientificName}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" fullWidth onClick={() => setStep('photo')}>
            ← Back to photo
          </Button>
        </Card>
      )}

      {step === 'details' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="space-y-3">
            {selectedSpecies ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm space-y-2">
                <p>
                  <span className="text-gray-600">Species: </span>
                  <span className="font-semibold text-emerald-950">{selectedSpecies.commonName}</span>
                  <button
                    type="button"
                    className="ml-2 text-xs font-semibold text-emerald-800 underline"
                    onClick={() => setStep('search')}
                  >
                    Change
                  </button>
                </p>
                {selectedSpecies.sunlight ? (
                  <p className="text-gray-700">
                    <span className="font-medium text-emerald-900">Light:</span> {selectedSpecies.sunlight}
                  </p>
                ) : null}
                {lightFitLabel ? <p className="text-xs text-emerald-700">{lightFitLabel}</p> : null}
                {selectedSpecies.toxicity ? (
                  <p className="text-gray-700">
                    <span className="font-medium text-emerald-900">Safety:</span> {selectedSpecies.toxicity}
                  </p>
                ) : null}
              </div>
            ) : null}
            <Input
              label="Nickname (optional)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Kitchen monstera"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Where it grows</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {PLANT_LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Outdoor locations skip indoor misting reminders.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pot size</label>
              <select
                value={potSize}
                onChange={(e) => setPotSize(e.target.value)}
                className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm"
              >
                <option value="SMALL">Small pot</option>
                <option value="MEDIUM">Medium pot</option>
                <option value="LARGE">Large pot</option>
              </select>
            </div>
            <Input
              label="Date planted (optional)"
              type="date"
              value={datePlanted}
              onChange={(e) => setDatePlanted(e.target.value)}
            />
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Where you bought it, care quirks, pet safety reminders…"
                rows={3}
                className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </Card>

          <Card>
            <p className="mb-2 text-sm font-medium text-gray-700">Your plant photo (optional)</p>
            <PhotoCaptureZone
              label="Add a photo for your garden"
              previewUrl={imageUrl || null}
              onFile={handlePlantPhoto}
            />
          </Card>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Saving…' : 'Save plant'}
          </Button>
          {step !== 'photo' && (
            <Button type="button" variant="ghost" fullWidth onClick={() => setStep('photo')}>
              ← Start over
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
