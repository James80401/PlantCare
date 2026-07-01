import { Capacitor } from '@capacitor/core';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBuddyCompanion } from '../context/BuddyCompanionContext';
import { registerPushNative } from '../lib/registerPushNative';
import { unregisterPushNative } from '../lib/unregisterPushNative';
import type { TemperatureUnit } from '../utils/temperature';
import {
  BUDDY_COMPANION_MODE_LABELS,
  buddyCompanionModes,
  readBuddyCompanionMode,
  writeBuddyCompanionMode,
} from '../hooks/buddy/displayMode';
import type { BuddyCompanionMode } from '../hooks/buddy/types';
import { formatApiErrorMessage } from '../utils/apiError';

interface LocationOption {
  latitude: number;
  longitude: number;
  label: string;
  timezone: string;
}

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
] as const;

const LIGHT_LEVELS = [
  { value: 'low', label: 'Low light' },
  { value: 'medium', label: 'Medium light' },
  { value: 'high', label: 'Bright light' },
] as const;

export default function Settings() {
  const { logout, refreshUser } = useAuth();
  const {
    buddy,
    missing: buddyMissing,
    loading: buddyLoading,
    updateBuddy,
  } = useBuddyCompanion();
  const navigate = useNavigate();
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [timezone, setTimezone] = useState('America/New_York');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('C');
  const [experienceLevel, setExperienceLevel] = useState('beginner');
  const [defaultLightLevel, setDefaultLightLevel] = useState('medium');
  const [buddyDisplayMode, setBuddyDisplayMode] = useState<BuddyCompanionMode>(() =>
    readBuddyCompanionMode(),
  );
  const [buddyDisplaySaved, setBuddyDisplaySaved] = useState(false);
  const [buddyDisplayError, setBuddyDisplayError] = useState('');
  const [saved, setSaved] = useState(false);
  const [carePrefsSaved, setCarePrefsSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi.me().then(({ data }) => {
      setNotifyPush(data.notifyPush);
      setNotifyEmail(data.notifyEmail);
      setNotifySms(data.notifySms);
      setTimezone(data.timezone || 'America/New_York');
      if (data.locationLabel) setLocationLabel(data.locationLabel);
      if (data.latitude) setLatitude(String(data.latitude));
      if (data.longitude) setLongitude(String(data.longitude));
      if (data.quietHoursStart != null) setQuietStart(String(data.quietHoursStart));
      if (data.quietHoursEnd != null) setQuietEnd(String(data.quietHoursEnd));
      if (data.temperatureUnit === 'F' || data.temperatureUnit === 'C') {
        setTemperatureUnit(data.temperatureUnit);
      }
      if (data.experienceLevel) setExperienceLevel(data.experienceLevel);
      if (data.defaultLightLevel) setDefaultLightLevel(data.defaultLightLevel);
    });
  }, []);

  useEffect(() => {
    if (!buddy?.floatingCompanionMode) return;
    setBuddyDisplayMode(buddy.floatingCompanionMode);
    writeBuddyCompanionMode(buddy.floatingCompanionMode);
  }, [buddy?.floatingCompanionMode]);

  const handleBuddyDisplayModeChange = async (mode: BuddyCompanionMode) => {
    setBuddyDisplayMode(mode);
    setBuddyDisplayError('');
    writeBuddyCompanionMode(mode);

    if (buddyMissing || !buddy) {
      setBuddyDisplaySaved(true);
      setTimeout(() => setBuddyDisplaySaved(false), 2000);
      return;
    }

    try {
      await updateBuddy({ floatingCompanionMode: mode });
      setBuddyDisplaySaved(true);
      setTimeout(() => setBuddyDisplaySaved(false), 2000);
    } catch {
      setBuddyDisplayError('Could not save Plant Buddy display preference.');
    }
  };

  const handleCarePrefsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await usersApi.updateCarePreferences({
        experienceLevel,
        defaultLightLevel,
      });
      await refreshUser();
      setCarePrefsSaved(true);
      setTimeout(() => setCarePrefsSaved(false), 2000);
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not save care preferences.'));
    }
  };

  useEffect(() => {
    if (locationQuery.trim().length < 2) {
      setLocationOptions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setLocationSearching(true);
      usersApi
        .searchWeatherLocations(locationQuery.trim())
        .then(({ data }) => setLocationOptions(data))
        .catch(() => setLocationOptions([]))
        .finally(() => setLocationSearching(false));
    }, 350);

    return () => window.clearTimeout(timer);
  }, [locationQuery]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    const hasCoords =
      lat !== undefined && !Number.isNaN(lat) && lng !== undefined && !Number.isNaN(lng);
    try {
      await usersApi.updateSettings({
        notifyPush,
        notifyEmail,
        notifySms,
        timezone,
        latitude: hasCoords ? lat : undefined,
        longitude: hasCoords ? lng : undefined,
        locationQuery: !hasCoords && locationQuery.trim() ? locationQuery.trim() : undefined,
        locationLabel: locationLabel || undefined,
        temperatureUnit,
      });
      if (hasCoords && locationLabel) {
        setLocationQuery('');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (notifyPush && Capacitor.isNativePlatform()) {
        void registerPushNative();
      } else if (!notifyPush) {
        void unregisterPushNative();
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not save settings.';
      setError(message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete your account and all plant data? This cannot be undone.')) return;
    await usersApi.deleteAccount();
    logout();
    navigate('/login');
  };

  const detectGeoLocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(String(pos.coords.latitude));
      setLongitude(String(pos.coords.longitude));
      setLocationQuery('');
      setLocationLabel('Current device location');
    });
  };

  const pickLocation = (option: LocationOption) => {
    setLocationQuery(option.label);
    setLocationLabel(option.label);
    setLatitude(String(option.latitude));
    setLongitude(String(option.longitude));
    setTimezone(option.timezone);
    setLocationOptions([]);
  };

  return (
    <div className="max-w-lg space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-emerald-900">Settings</h1>

      <section className="rounded-xl border border-emerald-100 bg-white p-6 space-y-3">
        <h2 className="font-semibold text-emerald-950">Plant Buddy</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your Finch-style companion — journeys, quests, shop, and Garden Town sunshine.
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-700">Floating Buddy</p>
            {buddyDisplaySaved ? (
              <span className="text-xs font-medium text-emerald-700">Saved</span>
            ) : null}
          </div>
          <div className="grid grid-cols-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-1">
            {buddyCompanionModes().map((mode) => {
              const active = buddyDisplayMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => void handleBuddyDisplayModeChange(mode)}
                  disabled={buddyLoading}
                  className={`min-h-10 rounded-lg px-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
                    active
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-emerald-800 hover:bg-white/70'
                  }`}
                  aria-pressed={active}
                >
                  {BUDDY_COMPANION_MODE_LABELS[mode]}
                </button>
              );
            })}
          </div>
          {buddyDisplayError ? (
            <p className="text-sm text-red-600">{buddyDisplayError}</p>
          ) : (
            <p className="text-xs leading-relaxed text-gray-500">
              This controls only the floating companion and follows your account across devices.
            </p>
          )}
        </div>
        <Link
          to="/garden/buddy"
          className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Open Plant Buddy
        </Link>
      </section>

      <section className="rounded-xl border border-emerald-100 bg-white p-6 space-y-3">
        <h2 className="font-semibold text-emerald-950">Household (Care Share)</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Create a household, invite caregivers, and share plants so others can help with watering and
          tasks.
        </p>
        <Link
          to="/garden/household"
          className="inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Manage household
        </Link>
      </section>

      <form
        onSubmit={handleCarePrefsSubmit}
        className="bg-white rounded-xl border border-emerald-100 p-6 space-y-4"
      >
        <h2 className="font-semibold text-emerald-950">Care preferences</h2>
        <p className="text-sm text-gray-600">
          Used for species recommendations and default detail level on plant care guides.
        </p>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Experience level</span>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {EXPERIENCE_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Typical light at home</span>
          <select
            value={defaultLightLevel}
            onChange={(e) => setDefaultLightLevel(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          >
            {LIGHT_LEVELS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Save care preferences
        </button>
        {carePrefsSaved ? <p className="text-sm text-emerald-700">Care preferences saved.</p> : null}
      </form>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-emerald-100 p-6 space-y-4">
        <h2 className="font-semibold">Notifications</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
          Push notifications
        </label>
        {notifyPush && (
          <p className="text-xs leading-relaxed text-gray-600">
            Includes care reminders and Plant Buddy alerts (journey return, sunshine, mood nudges).
            On mobile, allow notifications when prompted after saving.
          </p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
          Email reminders
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifySms} onChange={(e) => setNotifySms(e.target.checked)} />
          SMS (Premium)
        </label>

        <h2 className="font-semibold pt-2">Quiet hours (0–23)</h2>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            max={23}
            placeholder="Start"
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
            className="border rounded-lg px-3 py-2 w-24"
          />
          <input
            type="number"
            min={0}
            max={23}
            placeholder="End"
            value={quietEnd}
            onChange={(e) => setQuietEnd(e.target.value)}
            className="border rounded-lg px-3 py-2 w-24"
          />
        </div>

        <h2 className="font-semibold pt-2">Location (optional, for weather)</h2>
        <p className="text-sm text-gray-600">
          Weather advice is optional. We only fetch a 7-day forecast when you tap Advise by weather
          on your dashboard (once per calendar day). Location is not used for ads.
        </p>
        <button type="button" onClick={detectGeoLocation} className="text-sm text-emerald-700 hover:underline">
          Use my device location
        </button>
        <div className="relative">
          <input
            placeholder="City or address (e.g. Seattle, WA)"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            autoComplete="address-level2"
          />
          {locationSearching ? (
            <p className="mt-1 text-xs text-gray-500">Searching…</p>
          ) : null}
          {locationOptions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-emerald-100 bg-white shadow-lg">
              {locationOptions.map((option) => (
                <li key={`${option.latitude}-${option.longitude}`}>
                  <button
                    type="button"
                    onClick={() => pickLocation(option)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {locationLabel && !locationQuery ? (
          <p className="text-sm text-emerald-800">Saved: {locationLabel}</p>
        ) : null}
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer text-emerald-700">Advanced: latitude / longitude</summary>
          <div className="mt-2 space-y-2">
            <input
              placeholder="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
            <input
              placeholder="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </details>
        <h2 className="font-semibold pt-2">Temperature</h2>
        <p className="text-sm text-gray-600">Used in weather forecasts and advice.</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="temperatureUnit"
              checked={temperatureUnit === 'C'}
              onChange={() => setTemperatureUnit('C')}
            />
            Celsius (°C)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="temperatureUnit"
              checked={temperatureUnit === 'F'}
              onChange={() => setTemperatureUnit('F')}
            />
            Fahrenheit (°F)
          </label>
        </div>

        <input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Timezone (e.g. America/New_York)"
        />

        <button type="submit" className="w-full bg-emerald-700 text-white py-2 rounded-lg font-medium">
          Save settings
        </button>
        {saved && <p className="text-emerald-600 text-sm text-center">Saved!</p>}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>

      <button
        type="button"
        onClick={handleDelete}
        className="w-full border border-red-300 text-red-700 py-2 rounded-lg text-sm"
      >
        Delete account
      </button>
    </div>
  );
}
