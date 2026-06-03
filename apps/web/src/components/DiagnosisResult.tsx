import { useState } from 'react';

interface StructuredDetail {
  issueName?: string;
  summary?: string;
  likelyCauses?: string[];
  immediateActions?: string[];
  longTermCare?: string[];
  whenToSeekHelp?: string;
  intake?: {
    symptomDuration?: 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS';
    recentCareChange?:
      | 'NONE'
      | 'WATERING'
      | 'LIGHT'
      | 'REPOT'
      | 'FERTILIZER'
      | 'TEMPERATURE'
      | 'PEST_TREATMENT';
    pestsVisible?: boolean;
  };
}

interface DiagnosisResultProps {
  diagnosis: {
    resultLabel: string;
    confidence?: number | null;
    adviceText?: string | null;
    source?: string;
    detailJson?: string | null;
    resolved?: boolean;
    imageUrl?: string | null;
    symptomsText?: string | null;
    createdAt?: string;
  };
  onResolvedChange?: (resolved: boolean) => void;
  onCreateFollowUp?: (dueInDays: number, note?: string) => Promise<void>;
  followUpCreating?: boolean;
  hasFollowUpTask?: boolean;
  updating?: boolean;
}

function parseDetail(json?: string | null): StructuredDetail | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as StructuredDetail;
  } catch {
    return null;
  }
}

function sourceLabel(source?: string): string {
  switch (source) {
    case 'openai':
      return 'AI analysis (ChatGPT)';
    case 'huggingface':
      return 'Image model + care library';
    default:
      return 'Rule-based estimate';
  }
}

function intakeLabel(detail: StructuredDetail | null): string[] {
  if (!detail?.intake) return [];
  const labels: string[] = [];
  if (detail.intake.symptomDuration) {
    labels.push(
      `Duration: ${
        {
          TODAY: 'Today',
          DAYS_2_3: '2-3 days',
          DAYS_4_7: '4-7 days',
          WEEKS_2_PLUS: '2+ weeks',
        }[detail.intake.symptomDuration]
      }`,
    );
  }
  if (detail.intake.recentCareChange && detail.intake.recentCareChange !== 'NONE') {
    labels.push(
      `Recent change: ${
        {
          WATERING: 'Watering',
          LIGHT: 'Light exposure',
          REPOT: 'Repotting',
          FERTILIZER: 'Fertilizer',
          TEMPERATURE: 'Temperature/humidity',
          PEST_TREATMENT: 'Pest treatment',
          NONE: 'None',
        }[detail.intake.recentCareChange]
      }`,
    );
  }
  if (detail.intake.pestsVisible != null) {
    labels.push(`Visible pests: ${detail.intake.pestsVisible ? 'Yes' : 'No'}`);
  }
  return labels;
}

export default function DiagnosisResult({
  diagnosis,
  onResolvedChange,
  onCreateFollowUp,
  followUpCreating = false,
  hasFollowUpTask = false,
  updating = false,
}: DiagnosisResultProps) {
  const [followUpNote, setFollowUpNote] = useState('');
  const detail = parseDetail(diagnosis.detailJson);
  const showStructured =
    detail &&
    (detail.likelyCauses?.length ||
      detail.immediateActions?.length ||
      detail.longTermCare?.length);
  const intakeDetails = intakeLabel(detail);

  return (
    <div
      className={`rounded-2xl border p-4 text-sm space-y-3 ${
        diagnosis.resolved
          ? 'border-emerald-100 bg-emerald-50'
          : 'border-amber-100 bg-amber-50/70'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-emerald-950 text-base">{diagnosis.resultLabel}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                diagnosis.resolved
                  ? 'bg-emerald-700 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              {diagnosis.resolved ? 'Recovering / resolved' : 'Active follow-up'}
            </span>
          </div>
        </div>
        {onResolvedChange && (
          <button
            type="button"
            onClick={() => onResolvedChange(!diagnosis.resolved)}
            disabled={updating}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50 disabled:opacity-50"
          >
            {updating
              ? 'Saving...'
              : diagnosis.resolved
                ? 'Reopen issue'
                : 'Mark recovered'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {diagnosis.confidence != null && (
          <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-600">
            {Math.round(diagnosis.confidence * 100)}% confidence
          </span>
        )}
        {diagnosis.source && (
          <span className="text-xs text-emerald-700">{sourceLabel(diagnosis.source)}</span>
        )}
      </div>

      {diagnosis.symptomsText ? (
        <p className="text-sm text-gray-600">
          <span className="font-medium text-emerald-800">Reported: </span>
          {diagnosis.symptomsText}
        </p>
      ) : null}
      {intakeDetails.length ? (
        <div className="flex flex-wrap gap-1.5">
          {intakeDetails.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {diagnosis.imageUrl ? (
        <img
          src={diagnosis.imageUrl}
          alt={`Photo submitted for ${diagnosis.resultLabel} diagnosis`}
          className="max-h-56 w-full rounded-2xl object-cover border border-emerald-100"
          loading="lazy"
        />
      ) : null}

      {detail?.summary && <p className="text-gray-800">{detail.summary}</p>}

      {showStructured ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {detail.likelyCauses && detail.likelyCauses.length > 0 && (
            <div>
              <h4 className="font-medium text-emerald-800 mb-1">Likely causes</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {detail.likelyCauses.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          {detail.immediateActions && detail.immediateActions.length > 0 && (
            <div>
              <h4 className="font-medium text-emerald-800 mb-1">Do now</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {detail.immediateActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {detail.longTermCare && detail.longTermCare.length > 0 && (
            <div className="sm:col-span-2">
              <h4 className="font-medium text-emerald-800 mb-1">Ongoing care</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                {detail.longTermCare.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {detail.whenToSeekHelp && (
            <p className="sm:col-span-2 text-gray-600 italic border-t border-emerald-100 pt-2">
              {detail.whenToSeekHelp}
            </p>
          )}
        </div>
      ) : (
        diagnosis.adviceText && (
          <p className="text-gray-800 whitespace-pre-line">{diagnosis.adviceText}</p>
        )
      )}

      {onCreateFollowUp && !diagnosis.resolved ? (
        <div className="border-t border-emerald-100 pt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Recovery reminder
          </p>
          {hasFollowUpTask ? (
            <p className="text-sm text-emerald-800">
              A health check follow-up is already on your task list.
            </p>
          ) : (
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs font-medium text-gray-600">
                  What to check on follow-up (optional)
                </span>
                <input
                  type="text"
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="e.g. lower leaves still yellow, soil moisture"
                  maxLength={500}
                  className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {[3, 7, 14].map((days) => (
                  <button
                    key={days}
                    type="button"
                    disabled={followUpCreating}
                    onClick={() => onCreateFollowUp(days, followUpNote.trim() || undefined)}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {followUpCreating ? 'Scheduling…' : `Remind in ${days} days`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
