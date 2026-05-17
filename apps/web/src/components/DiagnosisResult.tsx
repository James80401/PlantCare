interface StructuredDetail {
  issueName?: string;
  summary?: string;
  likelyCauses?: string[];
  immediateActions?: string[];
  longTermCare?: string[];
  whenToSeekHelp?: string;
}

interface DiagnosisResultProps {
  diagnosis: {
    resultLabel: string;
    confidence?: number | null;
    adviceText?: string | null;
    source?: string;
    detailJson?: string | null;
    resolved?: boolean;
  };
  onResolvedChange?: (resolved: boolean) => void;
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

export default function DiagnosisResult({
  diagnosis,
  onResolvedChange,
  updating = false,
}: DiagnosisResultProps) {
  const detail = parseDetail(diagnosis.detailJson);
  const showStructured =
    detail &&
    (detail.likelyCauses?.length ||
      detail.immediateActions?.length ||
      detail.longTermCare?.length);

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
    </div>
  );
}
