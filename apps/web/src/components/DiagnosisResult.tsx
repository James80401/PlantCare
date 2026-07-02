import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveApiAssetUrl } from '../utils/apiAssets';
import { trackEvent } from '../utils/analytics';

interface StructuredDetail {
  issueName?: string;
  summary?: string;
  likelyCauses?: string[];
  immediateActions?: string[];
  longTermCare?: string[];
  whenToSeekHelp?: string;
  treatmentPlan?: {
    version?: number;
    headline?: string;
    urgency?: 'routine' | 'soon' | 'urgent';
    matchedProblems?: Array<{
      id: string;
      label: string;
      category: string;
      overview: string;
      expectedTimeline: string;
    }>;
    careArchetype?: {
      id: string;
      label: string;
      description: string;
    };
    steps?: Array<{
      key?: string;
      label: string;
      taskType: string;
      dueInDays: number;
      priority?: 'high' | 'medium' | 'low';
      section?: 'stabilize' | 'treat' | 'prevent' | 'follow_up';
    }>;
    mistakesToAvoid?: string[];
    expectedTimeline?: string;
    beginnerSafetyNotes?: string[];
  };
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
  plantCarePath?: string;
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

function urgencyClass(urgency?: string): string {
  switch (urgency) {
    case 'urgent':
      return 'bg-red-600 text-white';
    case 'soon':
      return 'bg-amber-600 text-white';
    default:
      return 'bg-emerald-700 text-white';
  }
}

function sectionLabel(section?: string): string {
  switch (section) {
    case 'stabilize':
      return 'Stabilize';
    case 'treat':
      return 'Treat';
    case 'prevent':
      return 'Prevent';
    case 'follow_up':
      return 'Follow up';
    default:
      return 'Plan';
  }
}

function dueLabel(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

const PROBLEM_GUIDE_PATHS: Record<string, string> = {
  'overwatering-root-risk': '/plant-problems/root-rot',
  'underwatering-dry-stress': '/plant-problems/drooping-leaves',
  'nutrient-light-yellowing': '/plant-problems/yellow-leaves',
  'fungal-leaf-spot': '/plant-problems',
  'pest-pressure': '/plant-problems',
  'environmental-shock': '/plant-problems/drooping-leaves',
};

function guideLinksForTreatmentPlan(treatmentPlan?: StructuredDetail['treatmentPlan']) {
  const links = new Map<string, { id: string; label: string; path: string }>();
  for (const problem of treatmentPlan?.matchedProblems ?? []) {
    const path = PROBLEM_GUIDE_PATHS[problem.id];
    if (path) links.set(problem.label, { id: problem.id, label: problem.label, path });
  }
  return [...links.values()];
}

function trackGuideLinkClick({
  surface,
  target,
  label,
  problemId,
  diagnosisLabel,
}: {
  surface: string;
  target: string;
  label: string;
  problemId?: string;
  diagnosisLabel: string;
}) {
  trackEvent('guide_link_click', {
    surface,
    target,
    label,
    problemId,
    diagnosisLabel,
  });
}

export default function DiagnosisResult({
  diagnosis,
  onResolvedChange,
  onCreateFollowUp,
  followUpCreating = false,
  hasFollowUpTask = false,
  updating = false,
  plantCarePath,
}: DiagnosisResultProps) {
  const [followUpNote, setFollowUpNote] = useState('');
  const detail = parseDetail(diagnosis.detailJson);
  const showStructured =
    detail &&
    (detail.likelyCauses?.length ||
      detail.immediateActions?.length ||
      detail.longTermCare?.length);
  const intakeDetails = intakeLabel(detail);
  const treatmentPlan = detail?.treatmentPlan;
  const treatmentGuideLinks = guideLinksForTreatmentPlan(treatmentPlan);

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
          src={resolveApiAssetUrl(diagnosis.imageUrl) ?? undefined}
          alt={`Photo submitted for ${diagnosis.resultLabel} diagnosis`}
          className="max-h-56 w-full rounded-2xl object-cover border border-emerald-100"
          loading="lazy"
        />
      ) : null}

      {detail?.summary && <p className="text-gray-800">{detail.summary}</p>}

      {treatmentPlan ? (
        <div className="rounded-2xl border border-white/80 bg-white/80 p-3 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Treatment plan
              </p>
              <h4 className="text-base font-semibold text-emerald-950">
                {treatmentPlan.headline ?? diagnosis.resultLabel}
              </h4>
              {treatmentPlan.careArchetype ? (
                <p className="mt-1 text-xs text-gray-600">
                  {treatmentPlan.careArchetype.label}: {treatmentPlan.careArchetype.description}
                </p>
              ) : null}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${urgencyClass(
                treatmentPlan.urgency,
              )}`}
            >
              {treatmentPlan.urgency === 'urgent'
                ? 'Act now'
                : treatmentPlan.urgency === 'soon'
                  ? 'Act soon'
                  : 'Routine'}
            </span>
          </div>

          {treatmentPlan.steps?.length ? (
            <ol className="space-y-2">
              {treatmentPlan.steps.slice(0, 5).map((step, index) => (
                <li
                  key={step.key ?? `${step.taskType}-${step.label}`}
                  className="grid grid-cols-[1.75rem_1fr] gap-2"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-gray-900">{step.label}</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        {dueLabel(step.dueInDays)}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        {sectionLabel(step.section)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          {treatmentPlan.matchedProblems?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {treatmentPlan.matchedProblems.map((problem) => (
                <Link
                  key={problem.id}
                  to={PROBLEM_GUIDE_PATHS[problem.id] ?? '/plant-problems'}
                  onClick={() =>
                    trackGuideLinkClick({
                      surface: 'diagnosis_matched_problem',
                      target: PROBLEM_GUIDE_PATHS[problem.id] ?? '/plant-problems',
                      label: problem.label,
                      problemId: problem.id,
                      diagnosisLabel: diagnosis.resultLabel,
                    })
                  }
                  className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-emerald-100"
                >
                  {problem.label}
                </Link>
              ))}
            </div>
          ) : null}

          {treatmentGuideLinks.length || plantCarePath ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Helpful next reads
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {treatmentGuideLinks.map((link) => (
                  <Link
                    key={`${link.path}-${link.label}`}
                    to={link.path}
                    onClick={() =>
                      trackGuideLinkClick({
                        surface: 'diagnosis_helpful_next_reads',
                        target: link.path,
                        label: link.label,
                        problemId: link.id,
                        diagnosisLabel: diagnosis.resultLabel,
                      })
                    }
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50"
                  >
                    {link.label}
                  </Link>
                ))}
                {plantCarePath ? (
                  <Link
                    to={plantCarePath}
                    onClick={() =>
                      trackGuideLinkClick({
                        surface: 'diagnosis_plant_care_guide',
                        target: plantCarePath,
                        label: "Open this plant's care guide",
                        diagnosisLabel: diagnosis.resultLabel,
                      })
                    }
                    className="rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                  >
                    Open this plant's care guide
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

          {treatmentPlan.expectedTimeline ? (
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-emerald-800">Recovery window: </span>
              {treatmentPlan.expectedTimeline}
            </p>
          ) : null}

          {treatmentPlan.mistakesToAvoid?.length ? (
            <details className="text-xs text-gray-600">
              <summary className="cursor-pointer font-semibold text-emerald-800">
                What to avoid
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {treatmentPlan.mistakesToAvoid.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}

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
