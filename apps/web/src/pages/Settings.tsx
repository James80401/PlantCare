import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { TemperatureUnit } from '../utils/temperature';

interface LocationOption {
  latitude: number;
  longitude: number;
  label: string;
  timezone: string;
}

export default function Settings() {
  const { logout } = useAuth();
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
  const [saved, setSaved] = useState(false);
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
    });
  }, []);

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

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-emerald-100 p-6 space-y-4">
        <h2 className="font-semibold">Notifications</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
          Push notifications
        </label>
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
