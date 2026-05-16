import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plantsApi, speciesApi } from '../services/api';
import { trackEvent } from '../utils/analytics';

interface Species {
  id: string;
  commonName: string;
  scientificName?: string;
}

import { PLANT_LOCATIONS } from '../constants/plantLocations';

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

  useEffect(() => {
    if (query.length < 2) {
      setSpeciesList([]);
      return;
    }
    const t = setTimeout(() => {
      speciesApi.search(query).then((r) => setSpeciesList(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

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

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-emerald-900">Add a plant</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-emerald-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSpeciesId('');
            }}
            placeholder="Search plants…"
            className="w-full border rounded-lg px-3 py-2"
          />
          {speciesList.length > 0 && !speciesId && (
            <ul className="mt-1 border rounded-lg bg-white shadow-sm max-h-40 overflow-auto">
              {speciesList.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm"
                    onClick={() => {
                      setSpeciesId(s.id);
                      setQuery(s.commonName);
                      setSpeciesList([]);
                    }}
                  >
                    {s.commonName}
                    {s.scientificName && (
                      <span className="text-gray-400 ml-2 italic">{s.scientificName}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Identify from photo</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={identifying}
            onChange={(e) => e.target.files?.[0] && handleIdentify(e.target.files[0])}
            className="text-sm"
          />
          {identifying && <p className="text-sm text-emerald-600 mt-1">Identifying…</p>}
        </div>

        <input
          placeholder="Nickname (optional)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Where it grows</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {PLANT_LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Outdoor and garden locations skip indoor misting reminders.
          </p>
        </div>

        <select
          value={potSize}
          onChange={(e) => setPotSize(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="SMALL">Small pot</option>
          <option value="MEDIUM">Medium pot</option>
          <option value="LARGE">Large pot</option>
        </select>

        <input
          type="date"
          value={datePlanted}
          onChange={(e) => setDatePlanted(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plant photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
            className="text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 text-white py-2 rounded-lg font-medium hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save plant'}
        </button>
      </form>
    </div>
  );
}
