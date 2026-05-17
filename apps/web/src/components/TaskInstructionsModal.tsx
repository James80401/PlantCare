import { useEffect, useState } from 'react';
import { tasksApi } from '../services/api';
import {
  careSectionToneClasses,
  getCareSectionMeta,
  sectionLead,
} from '../utils/careGuideSections';
import { formatGuideBody, taskTypeLabel } from '../utils/tasks';

export interface TaskInstructionsModalProps {
  taskId: string;
  taskType: string;
  plantLabel: string;
  onClose: () => void;
}

interface GuideImage {
  url: string;
  caption: string;
  altText: string;
  mediaType?: 'svg' | 'photo';
}

interface GuideSection {
  heading: string;
  body: string;
  images: GuideImage[];
}

interface Instructions {
  title: string;
  summary: string;
  speciesName: string;
  plantName: string;
  isSpeciesSpecific: boolean;
  sections: GuideSection[];
}

function sectionAnchor(heading: string, index: number): string {
  return `guide-sec-${index}-${heading.slice(0, 20).replace(/\W+/g, '-').toLowerCase()}`;
}

export default function TaskInstructionsModal({
  taskId,
  taskType,
  plantLabel,
  onClose,
}: TaskInstructionsModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guide, setGuide] = useState<Instructions | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    tasksApi
      .instructions(taskId)
      .then((r) => setGuide(r.data))
      .catch(() => setError('Could not load care instructions.'))
      .finally(() => setLoading(false));
  }, [taskId]);

  const showToc = (guide?.sections.length ?? 0) >= 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl">
        <div className="sticky top-0 z-10 bg-white/95 border-b border-emerald-100 px-4 py-3 flex items-start justify-between gap-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide truncate">
              {taskTypeLabel(taskType)} · {plantLabel}
            </p>
            {!loading && guide && (
              <p className="text-xs text-gray-500 truncate">{guide.plantName}</p>
            )}
            <h2 id="guide-title" className="text-xl font-bold text-emerald-950 font-display">
              {loading ? 'Loading…' : guide?.title ?? 'Care instructions'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-5 sm:p-5">
          {loading && (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-emerald-50" />
              <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          )}
          {error && (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {guide && (
            <>
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-white">
                    {guide.sections.length} care sections
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      guide.isSpeciesSpecific
                        ? 'bg-lime-100 text-lime-900'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {guide.isSpeciesSpecific
                      ? `Tailored for ${guide.speciesName}`
                      : 'General care guidance'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-700">{guide.summary}</p>
              </section>
              {showToc && (
                <nav className="text-sm border border-emerald-100 rounded-2xl p-3 bg-white">
                  <p className="font-semibold text-emerald-900 mb-2">Jump to</p>
                  <ul className="flex flex-wrap gap-2">
                    {guide.sections.map((sec, i) => (
                      <li key={sec.heading}>
                        <a
                          href={`#${sectionAnchor(sec.heading, i)}`}
                          className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                          {sec.heading}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              {guide.sections.map((section, index) => (
                <InstructionSection
                  key={`${section.heading}-${index}`}
                  section={section}
                  anchor={sectionAnchor(section.heading, index)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InstructionSection({ section, anchor }: { section: GuideSection; anchor: string }) {
  const meta = getCareSectionMeta(section.heading);
  const toneClasses = careSectionToneClasses(meta.tone);
  const lead = sectionLead(section);

  return (
    <section
      id={anchor}
      className={`space-y-3 scroll-mt-24 rounded-2xl border p-4 ${toneClasses.card}`}
    >
      <div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses.badge}`}>
          {meta.label}
        </span>
        <h3 className="mt-3 text-lg font-semibold text-emerald-950">{section.heading}</h3>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
          {meta.intent}
        </p>
      </div>

      {lead ? (
        <p className="rounded-xl bg-white/75 px-3 py-2 text-sm font-medium leading-6 text-gray-700">
          {lead}
        </p>
      ) : null}

      <div
        className="text-sm text-gray-700 leading-6 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
        dangerouslySetInnerHTML={{ __html: formatGuideBody(section.body) }}
      />

      {section.images.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {section.images.map((img) => (
            <figure
              key={img.url}
              className={`overflow-hidden rounded-2xl border ${
                img.mediaType === 'photo'
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-emerald-100 bg-emerald-50/50'
              }`}
            >
              <img
                src={img.url}
                alt={img.altText}
                className="w-full h-auto max-h-64 object-cover object-center"
                loading="lazy"
              />
              <figcaption className="flex gap-2 px-3 py-2 text-xs text-gray-600">
                <span className="min-w-0 flex-1">{img.caption}</span>
                {img.mediaType === 'photo' && (
                  <span className="flex-shrink-0 text-gray-400">Reference photo</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
