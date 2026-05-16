import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [timezone, setTimezone] = useState('America/New_York');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    usersApi.me().then(({ data }) => {
      setNotifyPush(data.notifyPush);
      setNotifyEmail(data.notifyEmail);
      setNotifySms(data.notifySms);
      setTimezone(data.timezone || 'America/New_York');
      if (data.latitude) setLatitude(String(data.latitude));
      if (data.longitude) setLongitude(String(data.longitude));
      if (data.quietHoursStart != null) setQuietStart(String(data.quietHoursStart));
      if (data.quietHoursEnd != null) setQuietEnd(String(data.quietHoursEnd));
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await usersApi.updateSettings({
      notifyPush,
      notifyEmail,
      notifySms,
      timezone,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      quietHoursStart: quietStart !== '' ? parseInt(quietStart, 10) : null,
      quietHoursEnd: quietEnd !== '' ? parseInt(quietEnd, 10) : null,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    });
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

        <h2 className="font-semibold pt-2">Location (for weather)</h2>
        <button type="button" onClick={detectGeoLocation} className="text-sm text-emerald-700 hover:underline">
          Use my location
        </button>
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
        <input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Timezone"
        />

        <button type="submit" className="w-full bg-emerald-700 text-white py-2 rounded-lg font-medium">
          Save settings
        </button>
        {saved && <p className="text-emerald-600 text-sm text-center">Saved!</p>}
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
