import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PhotoCaptureZone } from '../components/plants/PhotoCaptureZone';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import {
  defaultSpeciesDiscoveryFilters,
  SPECIES_DISCOVERY_FILTERS,
  type SpeciesDiscoveryFilterKey,
} from '../constants/speciesDiscovery';
import { plantsApi, speciesApi, gardensApi, type GardenSummaryCard } from '../services/api';
import { CreateGardenForm } from '../components/gardens/CreateGardenForm';
import { useAuth } from '../context/AuthContext';
import { trackEvent, trackOnce } from '../utils/analytics';
import { resolveApiAssetUrl } from '../utils/apiAssets';
import {
  confidenceReviewCopy,
  confidenceTone,
  normalizeConfidence,
  PLANT_LIFE_STAGE_OPTIONS,
  type AddPlantStep,
  type ExternalSpeciesMatch,
  type Species,
} from './add-plant/addPlantModel';

export default function AddPlantWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<AddPlantStep>('photo');

  // Garden-first: a plant must be added into a garden. Resolve the target garden from
  // the ?gardenId= param (when arriving from a Garden Dashboard) or default to the
  // user's first garden. If the user has none, gate the wizard behind garden creation.
  const [gardens, setGardens] = useState<GardenSummaryCard[]>([]);
  const [gardensLoaded, setGardensLoaded] = useState(false);
  const [selectedGardenId, setSelectedGardenId] = useState('');
  const [showCreateGarden, setShowCreateGarden] = useState(false);

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
  const [externalMatch, setExternalMatch] = useState<ExternalSpeciesMatch | null>(null);
  const [identifyConfidence, setIdentifyConfidence] = useState<number | null>(null);

  const [nickname, setNickname] = useState('');
  const [potSize, setPotSize] = useState('MEDIUM');
  const [lifeStage, setLifeStage] = useState<(typeof PLANT_LIFE_STAGE_OPTIONS)[number]['value']>('ESTABLISHED');
  const [approximateAgeMonths, setApproximateAgeMonths] = useState('');
  const [datePlanted, setDatePlanted] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [identifyPreview, setIdentifyPreview] = useState<string | null>(null);
  const [plantPhotoPreview, setPlantPhotoPreview] = useState<string | null>(null);
  const [plantPhotoFile, setPlantPhotoFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const uploadRequestIdRef = useRef(0);
  const createRequestIdRef = useRef(crypto.randomUUID());

  const [error, setError] = useState('');
  const [limitError, setLimitError] = useState<{ message: string; code: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [confirmingExternal, setConfirmingExternal] = useState(false);
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

  useEffect(() => {
    return () => {
      if (plantPhotoPreview?.startsWith('blob:')) URL.revokeObjectURL(plantPhotoPreview);
    };
  }, [plantPhotoPreview]);

  const selectSpecies = (species: Species) => {
    setSpeciesId(species.id);
    setSelectedSpecies(species);
    setExternalMatch(null);
    setQuery(species.commonName);
    setSpeciesList([]);
    setStep('details');
  };

  const setPlantPhotoFromFile = async (file: File) => {
    setPlantPhotoFile(file);
    const uploadRequestId = uploadRequestIdRef.current + 1;
    uploadRequestIdRef.current = uploadRequestId;
    setImageUploading(true);
    setError('');
    setPlantPhotoPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    try {
      const { data } = await plantsApi.upload(file);
      if (uploadRequestIdRef.current === uploadRequestId) {
        setImageUrl(data.url);
      }
    } catch {
      if (uploadRequestIdRef.current === uploadRequestId) {
        setError('Could not upload photo.');
      }
    } finally {
      if (uploadRequestIdRef.current === uploadRequestId) {
        setImageUploading(false);
      }
    }
  };

  const handleIdentify = async (file: File) => {
    if (identifyPreview?.startsWith('blob:')) URL.revokeObjectURL(identifyPreview);
    setIdentifyPreview(URL.createObjectURL(file));
    void setPlantPhotoFromFile(file);
    setIdentifying(true);
    setError('');
    setLimitError(null);
    try {
      const { data } = await plantsApi.identify(file);
      setIdentifyConfidence(normalizeConfidence(data.confidence));
      if (data.species) {
        const species = data.species as Species;
        setSpeciesId(species.id);
        setSelectedSpecies(species);
        setExternalMatch(null);
        setQuery(species.commonName);
      } else if (data.externalMatch) {
        const match = data.externalMatch as ExternalSpeciesMatch;
        setSpeciesId('');
        setSelectedSpecies(null);
        setExternalMatch(match);
        setQuery(match.commonName);
      } else {
        throw new Error('No identification match returned');
      }
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

  const confirmExternalMatch = async () => {
    if (!externalMatch) return;
    setConfirmingExternal(true);
    setError('');
    try {
      const { data } = await plantsApi.confirmExternalSpecies({
        provider: externalMatch.provider,
        providerMatchId: externalMatch.providerMatchId,
        commonName: externalMatch.commonName,
        scientificName: externalMatch.scientificName,
        confidence: externalMatch.confidence,
      });
      const species = data.species as Species;
      setSpeciesId(species.id);
      setSelectedSpecies(species);
      setExternalMatch(null);
      setQuery(species.commonName);
      setStep('details');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(data?.message || 'Could not confirm this plant. Try search instead.');
    } finally {
      setConfirmingExternal(false);
    }
  };

  const handlePlantPhoto = async (file: File) => {
    await setPlantPhotoFromFile(file);
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
        clientRequestId: createRequestIdRef.current,
        gardenId: selectedGardenId,
        speciesId,
        nickname: nickname || undefined,
        potSize,
        lifeStage,
        approximateAgeMonths:
          approximateAgeMonths.trim() === '' ? undefined : Number(approximateAgeMonths),
        datePlanted: datePlanted || undefined,
        notes: notes.trim() || undefined,
        imageUrl: imageUrl || undefined,
      });
      trackEvent('plant_added', { speciesId });
      trackOnce('first_plant_added', 'first_plant_added', { speciesId });
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

  const addCreatedGarden = (g: { id: string; name: string; location?: string | null }) => {
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
    setShowCreateGarden(false);
  };

  // Do not let the wizard advance before its required garden context is known.
  // Otherwise a fast interaction can reach Save with no selected garden.
  if (!gardensLoaded) {
    return (
      <div className="mx-auto max-w-lg space-y-5">
        <PageHeader
          eyebrow="Grow your garden"
          title="Add a plant"
          description="Loading your gardens before we begin."
        />
        <Card>
          <p className="text-sm font-medium text-emerald-900" role="status">
            Loading gardens…
          </p>
        </Card>
      </div>
    );
  }

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
            onCreated={addCreatedGarden}
          />
        </Card>
      </div>
    );
  }

  const selectedGarden = gardens.find((g) => g.id === selectedGardenId);
  const identifiedMatch = selectedSpecies ?? externalMatch;
  const isExternalConfirmation = !selectedSpecies && Boolean(externalMatch);
  const hasSearchCriteria = query.trim().length >= 2 || Object.values(activeFilters).some(Boolean);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Grow your garden"
        title="Add a plant"
        description={
          step === 'photo'
            ? 'Use a photo when you are unsure, or search by name when you already know the plant.'
            : stepTitle
        }
        help="add-plant"
      />
      {gardens.length > 0 ? (
        <Card className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
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
            </label>
            <Button
              type="button"
              variant={showCreateGarden ? 'ghost' : 'secondary'}
              onClick={() => setShowCreateGarden((value) => !value)}
            >
              {showCreateGarden ? 'Cancel' : 'New garden'}
            </Button>
          </div>
          {selectedGarden && !selectedGarden.isOwner ? (
            <span className="text-xs text-violet-700">
              You're a caretaker of this shared garden.
            </span>
          ) : null}
          {showCreateGarden ? (
            <div className="border-t border-emerald-100 pt-3">
              <CreateGardenForm submitLabel="Create and select garden" onCreated={addCreatedGarden} />
            </div>
          ) : null}
        </Card>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
              <p className="text-sm font-semibold text-emerald-950">Identify from a photo</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Best when you do not know the plant name. You will review the match before anything is saved.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
              <p className="text-sm font-semibold text-sky-950">Search by name</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Fastest when you know a common name like pothos, basil, monstera, or snake plant.
              </p>
            </div>
          </div>
          <PhotoCaptureZone
            label="Take or upload a photo"
            hint="We’ll suggest a species from the image"
            busy={identifying}
            previewUrl={identifyPreview}
            onFile={handleIdentify}
            sourceMode="both"
          />
          <Button variant="secondary" fullWidth onClick={() => setStep('search')}>
            Search by name
          </Button>
          <Link
            to="/garden/plants/browse"
            className="block text-center text-sm font-semibold text-emerald-800 hover:underline"
          >
            Browse the full catalog
          </Link>
        </Card>
      )}

      {step === 'confirm' && identifiedMatch && (
        <Card className="space-y-4">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
              {selectedSpecies?.defaultImageUrl ? (
                <img
                  src={resolveApiAssetUrl(selectedSpecies.defaultImageUrl) ?? undefined}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : identifyPreview ? (
                <img
                  src={identifyPreview}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-3xl">🌿</div>
              )}
            </div>
            <div className="min-w-0">
              {isExternalConfirmation ? (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {confidenceTone(identifyConfidence)}
                </p>
              ) : null}
              <p className="font-display text-xl font-bold text-emerald-950">
                {identifiedMatch.commonName}
              </p>
              {identifiedMatch.scientificName ? (
                <p className="text-sm italic text-gray-500">{identifiedMatch.scientificName}</p>
              ) : null}
              {externalMatch?.careArchetype ? (
                <p className="mt-2 text-xs text-gray-600">
                  Dr. Plant will start with{' '}
                  <span className="font-semibold text-emerald-900">
                    {externalMatch.careArchetype.label}
                  </span>{' '}
                  care until species-specific notes are reviewed.
                </p>
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
          {isExternalConfirmation ? (
            <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="font-semibold">Confirm only if this looks like your plant.</p>
              <p>{confidenceReviewCopy(identifyConfidence)}</p>
              <p>
                Confirming adds this match to Dr. Plant as a provisional species record, saves the provider confidence for admin review, and starts with approximate care guidance until the species is reviewed.
              </p>
            </div>
          ) : null}
          <Button
            fullWidth
            onClick={isExternalConfirmation ? confirmExternalMatch : () => setStep('details')}
            disabled={confirmingExternal}
          >
            {confirmingExternal
              ? 'Confirming...'
              : isExternalConfirmation
                ? 'Confirm and add to Dr. Plant'
                : 'Yes, add this plant'}
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
              setExternalMatch(null);
            }}
            placeholder="e.g. Monstera, Basil, Snake plant"
            hint="Common names work. You do not need the scientific name."
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
          {speciesList.length > 0 ? (
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
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/50 px-4 py-4 text-sm text-gray-700">
              {hasSearchCriteria ? (
                <>
                  <p className="font-semibold text-emerald-950">No matching plants yet</p>
                  <p className="mt-1 leading-6">
                    Try a shorter common name, clear one filter, browse the catalog, or use photo identification if you are not sure what it is.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-emerald-950">Start with any common name</p>
                  <p className="mt-1 leading-6">
                    Type at least two letters, or use filters like pet-safe, low light, edible, or indoor.
                  </p>
                </>
              )}
            </div>
          )}
          <Link
            to="/garden/plants/browse"
            className="block text-center text-sm font-semibold text-emerald-800 hover:underline"
          >
            Browse the full catalog
          </Link>
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
            <div className="rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
              <p className="font-semibold">Only garden and species are required.</p>
              <p className="mt-1 leading-6">
                Dr. Plant can start with safe defaults. Nickname, age, date, notes, and photo can all be added later.
              </p>
            </div>
            <Input
              label="Nickname (optional)"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Kitchen monstera"
            />
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm">
              <p className="font-medium text-emerald-950">Growing area</p>
              <p className="mt-1 text-gray-700">
                This plant will inherit{' '}
                <span className="font-semibold text-emerald-900">
                  {selectedGarden?.location || 'the selected garden area'}
                </span>{' '}
                from {selectedGarden?.name || 'its garden'}.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Change the garden to change whether new plants are indoor or outdoor.
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Plant age / stage
                </label>
                <select
                  value={lifeStage}
                  onChange={(e) =>
                    setLifeStage(e.target.value as (typeof PLANT_LIFE_STAGE_OPTIONS)[number]['value'])
                  }
                  className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {PLANT_LIFE_STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Approximate age in months (optional)"
                type="number"
                min="0"
                max="1200"
                inputMode="numeric"
                value={approximateAgeMonths}
                onChange={(e) => setApproximateAgeMonths(e.target.value)}
                placeholder="e.g. 3"
              />
              <p className="text-xs text-gray-500">
                Age helps Dr. Plant tune reminders. Sprouts and seedlings skip harsh care tasks and get closer moisture checks.
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
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-700">Your plant photo (optional)</p>
              {plantPhotoPreview && identifyPreview ? (
                <p className="mt-1 text-xs text-emerald-700">
                  Using the identification photo. You can replace it here.
                </p>
              ) : null}
            </div>
            <PhotoCaptureZone
              label="Add a photo for your garden"
              hint={imageUploading ? 'Uploading photo...' : undefined}
              busy={imageUploading}
              busyLabel="Uploading photo..."
              previewUrl={plantPhotoPreview || imageUrl || null}
              onFile={handlePlantPhoto}
              sourceMode="both"
            />
            {plantPhotoFile && !imageUrl && !imageUploading ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => void setPlantPhotoFromFile(plantPhotoFile)}
              >
                Retry photo upload
              </Button>
            ) : null}
          </Card>

          <Button type="submit" fullWidth disabled={loading || imageUploading}>
            {loading ? 'Saving…' : imageUploading ? 'Uploading photo...' : 'Save plant'}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={() => setStep('photo')}>
            ← Start over
          </Button>
        </form>
      )}
    </div>
  );
}
