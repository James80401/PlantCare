import { useState, type ReactNode } from 'react';
import {
  careSectionToneClasses,
  getCareSectionMeta,
  getStructuredCareSectionMeta,
  sectionLead,
  type PlantCareTopicId,
} from '../../utils/careGuideSections';
import { formatGuideBody } from '../../utils/tasks';
import type { CareDetailLevel } from '../../pages/plant-profile/types';

export interface StructuredCareSectionProps {
  id?: PlantCareTopicId;
  heading: string;
  body?: string;
  whyItMatters?: string;
  beginnerBody?: string;
  advancedBody?: string;
  warnings?: string[];
  defaultDetailLevel?: CareDetailLevel;
  footer?: ReactNode;
}

export function StructuredCareSectionCard({
  id,
  heading,
  body,
  whyItMatters,
  beginnerBody,
  advancedBody,
  warnings = [],
  defaultDetailLevel = 'beginner',
  footer,
}: StructuredCareSectionProps) {
  const structured = Boolean(beginnerBody || advancedBody || whyItMatters);
  const [detailLevel, setDetailLevel] = useState<CareDetailLevel>(defaultDetailLevel);
  const meta = id
    ? getStructuredCareSectionMeta(id, heading)
    : getCareSectionMeta(heading);
  const toneClasses = careSectionToneClasses(meta.tone);
  const resolvedBody = structured
    ? detailLevel === 'advanced' && advancedBody
      ? advancedBody
      : (beginnerBody ?? body ?? '')
    : (body ?? '');
  const lead = structured
    ? whyItMatters
    : sectionLead({ heading, body: resolvedBody });

  return (
    <article className={`rounded-2xl border p-4 ${toneClasses.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses.badge}`}>
            {meta.label}
          </span>
          <h3 className="mt-3 font-semibold text-emerald-950">{heading}</h3>
        </div>
        {structured && beginnerBody && advancedBody ? (
          <div
            className="flex rounded-full border border-emerald-200 bg-white p-0.5 text-xs font-semibold"
            role="group"
            aria-label="Detail level"
          >
            {(['beginner', 'advanced'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDetailLevel(level)}
                className={`rounded-full px-3 py-1.5 capitalize transition ${
                  detailLevel === level
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
                aria-pressed={detailLevel === level}
              >
                {level}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {lead ? (
        <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-medium leading-6 text-gray-700">
          {lead}
        </p>
      ) : null}
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {meta.intent}
      </p>
      <div
        className="mt-3 text-sm leading-6 text-gray-700 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
        dangerouslySetInnerHTML={{ __html: formatGuideBody(resolvedBody) }}
      />
      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
          {warnings.map((warning) => (
            <li key={warning} className="flex gap-2 leading-5">
              <span className="font-semibold" aria-hidden>
                !
              </span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {footer}
    </article>
  );
}
