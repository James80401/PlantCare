import { useEffect, useState } from 'react';
import { tasksApi } from '../services/api';
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
      <div className="relative bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="sticky top-0 z-10 bg-white border-b border-emerald-100 px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-emerald-700 font-medium uppercase tracking-wide truncate">
              {taskTypeLabel(taskType)} · {plantLabel}
            </p>
            {!loading && guide && (
              <p className="text-xs text-gray-500 truncate">{guide.plantName}</p>
            )}
            <h2 id="guide-title" className="text-lg font-bold text-emerald-900">
              {loading ? 'Loading…' : guide?.title ?? 'Care instructions'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none px-1 flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-5">
          {loading && <p className="text-gray-500 text-sm">Loading guide…</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {guide && (
            <>
              <p className="text-sm text-gray-600">{guide.summary}</p>
              {guide.isSpeciesSpecific && (
                <p className="text-xs bg-emerald-50 text-emerald-800 px-2 py-1 rounded inline-block">
                  Tailored for {guide.speciesName}
                </p>
              )}
              {showToc && (
                <nav className="text-sm border border-emerald-100 rounded-lg p-3 bg-emerald-50/40">
                  <p className="font-medium text-emerald-800 mb-2">In this guide</p>
                  <ul className="space-y-1">
                    {guide.sections.map((sec, i) => (
                      <li key={sec.heading}>
                        <a
                          href={`#${sectionAnchor(sec.heading, i)}`}
                          className="text-emerald-700 hover:underline"
                        >
                          {sec.heading}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              {guide.sections.map((section, index) => (
                <section
                  key={`${section.heading}-${index}`}
                  id={sectionAnchor(section.heading, index)}
                  className="space-y-3 scroll-mt-24"
                >
                  <h3 className="font-semibold text-emerald-800">{section.heading}</h3>
                  <div
                    className="text-sm text-gray-700 leading-relaxed prose-p:my-2"
                    dangerouslySetInnerHTML={{ __html: formatGuideBody(section.body) }}
                  />
                  {section.images.length > 0 && (
                    <div className="space-y-3">
                      {section.images.map((img) => (
                        <figure
                          key={img.url}
                          className={`border rounded-lg overflow-hidden ${
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
                          <figcaption className="text-xs text-gray-600 px-3 py-2 flex justify-between gap-2">
                            <span>{img.caption}</span>
                            {img.mediaType === 'photo' && (
                              <span className="text-gray-400 flex-shrink-0">Reference photo</span>
                            )}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
