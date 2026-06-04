import { useEffect, useState } from 'react';
import {
  diagnosisApi,
  type DrPlantContextItem,
  type DrPlantContextSummary,
} from '../services/api';

const CATEGORY_STYLE: Record<
  DrPlantContextItem['category'],
  { ring: string; text: string; icon: string }
> = {
  care: { ring: 'bg-emerald-50 ring-emerald-100', text: 'text-emerald-900', icon: '🌱' },
  health: { ring: 'bg-rose-50 ring-rose-100', text: 'text-rose-900', icon: '🩺' },
  tasks: { ring: 'bg-sky-50 ring-sky-100', text: 'text-sky-900', icon: '🗓️' },
  feedback: { ring: 'bg-amber-50 ring-amber-100', text: 'text-amber-900', icon: '💬' },
  journal: { ring: 'bg-lime-50 ring-lime-100', text: 'text-lime-900', icon: '📖' },
  weather: { ring: 'bg-indigo-50 ring-indigo-100', text: 'text-indigo-900', icon: '⛅' },
};

/**
 * Compact, expandable "What Dr. Plant sees" panel. Surfaces the same recent-care
 * and condition signals the assistant uses, so advice that references recent
 * events is understandable. Renders nothing if the context can't load.
 */
export default function DrPlantContextPanel({ plantId }: { plantId: string }) {
  const [summary, setSummary] = useState<DrPlantContextSummary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSummary(null);
    setFailed(false);
    diagnosisApi
      .getContextSummary(plantId)
      .then((r) => {
        if (active) setSummary(r.data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [plantId]);

  if (failed || !summary || summary.items.length === 0) return null;

  return (
    <details className="group rounded-2xl border border-emerald-100 bg-white/70 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-emerald-900">
        <span className="flex items-center gap-2">
          <span aria-hidden>🔎</span> What Dr. Plant sees
        </span>
        <span className="text-xs font-medium text-emerald-700">
          {summary.items.length} signal{summary.items.length === 1 ? '' : 's'}
          <span className="ml-1 inline-block transition group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </span>
      </summary>
      <p className="mt-2 text-xs leading-5 text-gray-600">{summary.intro}</p>
      <ul className="mt-3 space-y-2">
        {summary.items.map((item, index) => {
          const style = CATEGORY_STYLE[item.category];
          return (
            <li
              key={`${item.category}-${index}`}
              className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ring-1 ${style.ring}`}
            >
              <span aria-hidden>{style.icon}</span>
              <span className="min-w-0">
                <span className={`font-semibold ${style.text}`}>{item.label}</span>
                {item.detail ? (
                  <span className="mt-0.5 block text-xs leading-5 text-gray-600">{item.detail}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
