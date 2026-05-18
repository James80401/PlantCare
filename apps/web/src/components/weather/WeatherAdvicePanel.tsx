import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { usersApi } from '../../services/api';
import { formatTemperatureRange, type TemperatureUnit } from '../../utils/temperature';
import { RainSkipOutdoorWatering } from './RainSkipOutdoorWatering';

interface WeatherAdvicePayload {
  fromCache: boolean;
  fetchedAt: string;
  locationLabel: string | null;
  timezone: string;
  overviewAlerts: Array<{
    type: string;
    severity: 'info' | 'warning';
    title: string;
    message: string;
    when: string;
  }>;
  summary: {
    days: Array<{
      date: string;
      tempMinC: number;
      tempMaxC: number;
      rainProbability: number;
    }>;
  };
  plants: Array<{
    plantId: string;
    plantName: string;
    environment: string;
    advice: string;
    severity: 'info' | 'warning';
  }>;
}

interface WeatherAdviceStatus {
  hasLocation: boolean;
  canFetchToday: boolean;
  fetchedAt: string | null;
  nextAvailableAt: string | null;
  locationLabel: string | null;
  cachedAdvice: WeatherAdvicePayload | null;
}

export function WeatherAdvicePanel() {
  const [status, setStatus] = useState<WeatherAdviceStatus | null>(null);
  const [advice, setAdvice] = useState<WeatherAdvicePayload | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>('C');

  const loadStatus = () => {
    setLoadingStatus(true);
    usersApi
      .weatherAdviceStatus()
      .then(({ data }) => {
        setStatus(data);
        if (data.cachedAdvice) {
          setAdvice(data.cachedAdvice);
          setExpanded(true);
        }
      })
      .catch(() => setError('Could not load weather status.'))
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => {
    loadStatus();
    usersApi.me().then(({ data }) => {
      if (data.temperatureUnit === 'F' || data.temperatureUnit === 'C') {
        setTemperatureUnit(data.temperatureUnit);
      }
    });
  }, []);

  const runAdvice = async () => {
    setShowConfirm(false);
    setLoadingAdvice(true);
    setError('');
    try {
      const { data } = await usersApi.fetchWeatherAdvice();
      setAdvice(data);
      setExpanded(true);
      loadStatus();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not fetch weather advice.';
      setError(message);
    } finally {
      setLoadingAdvice(false);
    }
  };

  if (loadingStatus) {
    return (
      <section className="rounded-3xl border border-sky-100 bg-sky-50/50 p-4 text-sm text-gray-600">
        Loading weather options…
      </section>
    );
  }

  if (!status?.hasLocation) {
    return (
      <section className="rounded-3xl border border-dashed border-sky-200 bg-white p-4">
        <h2 className="text-base font-semibold text-emerald-950 font-display">Weather advice</h2>
        <p className="mt-1 text-sm text-gray-600">
          Optional. Add your city in Settings, then get a 7-day forecast with tips for each plant (once
          per day).
        </p>
        <Link
          to="/garden/settings"
          className="mt-3 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          Add location
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-emerald-950 font-display">Weather advice</h2>
          <p className="mt-1 text-sm text-gray-600">
            {status.locationLabel ? `For ${status.locationLabel}` : 'For your saved location'}
            {status.fetchedAt && !status.canFetchToday
              ? ` · Updated ${format(parseISO(status.fetchedAt), 'p')}`
              : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {advice && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50"
            >
              {expanded ? 'Hide' : "View today's advice"}
            </button>
          )}
          <button
            type="button"
            disabled={loadingAdvice}
            onClick={() => {
              if (status.canFetchToday) {
                setShowConfirm(true);
              } else if (advice) {
                setExpanded(true);
              }
            }}
            className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
          >
            {loadingAdvice
              ? 'Loading…'
              : status.canFetchToday
                ? 'Advise by weather'
                : "View today's advice"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {!status.canFetchToday && status.nextAvailableAt ? (
        <p className="mt-2 text-xs text-sky-900/80">
          Daily check used. You can view results again today; next new forecast tomorrow.
        </p>
      ) : null}

      {expanded && advice ? (
        <AdviceResults
          advice={advice}
          temperatureUnit={temperatureUnit}
        />
      ) : null}

      {showConfirm ? (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="weather-confirm-title"
          >
            <h3 id="weather-confirm-title" className="text-lg font-semibold text-emerald-950">
              Get 7-day weather advice?
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              This uses <strong>one daily weather check</strong> for{' '}
              {status.locationLabel || 'your area'}. You can open the results again today without
              using another check.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runAdvice}
                className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                Get advice
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </section>
  );
}

function AdviceResults({
  advice,
  temperatureUnit,
}: {
  advice: WeatherAdvicePayload;
  temperatureUnit: TemperatureUnit;
}) {
  const hasRainAlert = advice.overviewAlerts.some((alert) => alert.type === 'rain');

  return (
    <div className="mt-4 space-y-4">
      <RainSkipOutdoorWatering hasRainAlert={hasRainAlert} />

      {advice.overviewAlerts.length > 0 && (
        <div className="space-y-2">
          {advice.overviewAlerts.map((alert) => (
            <article
              key={`${alert.type}-${alert.when}`}
              className={`rounded-2xl border p-3 text-sm ${
                alert.severity === 'warning'
                  ? 'border-sky-200 bg-sky-50 text-sky-950'
                  : 'border-emerald-100 bg-white text-gray-700'
              }`}
            >
              <p className="font-semibold">{alert.title}</p>
              <p className="mt-1 leading-6">{alert.message}</p>
            </article>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">7-day outlook</p>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {advice.summary.days.map((day) => (
            <div
              key={day.date}
              className="rounded-xl bg-white px-1 py-2 text-center text-[0.65rem] ring-1 ring-sky-100"
            >
              <p className="font-semibold text-sky-900">{format(parseISO(day.date), 'EEE')}</p>
              <p className="mt-0.5 text-gray-500">{format(parseISO(day.date), 'MMM d')}</p>
              <p className="mt-1 font-bold text-emerald-900">
                {formatTemperatureRange(day.tempMinC, day.tempMaxC, temperatureUnit)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Per plant</p>
        <ul className="mt-2 space-y-2">
          {advice.plants.length === 0 ? (
            <li className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-600 ring-1 ring-sky-100">
              Add plants to your garden to see tailored lines.
            </li>
          ) : (
            advice.plants.map((plant) => (
              <li
                key={plant.plantId}
                className={`rounded-2xl px-3 py-2 text-sm ring-1 ${
                  plant.severity === 'warning'
                    ? 'bg-amber-50 text-amber-950 ring-amber-100'
                    : 'bg-white text-gray-700 ring-sky-100'
                }`}
              >
                <Link
                  to={`/garden/plants/${plant.plantId}`}
                  className="font-semibold text-emerald-950 hover:underline"
                >
                  {plant.plantName}
                </Link>
                <p className="mt-0.5 leading-6">{plant.advice}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
