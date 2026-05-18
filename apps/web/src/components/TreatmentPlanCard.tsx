import DiagnosisResult from './DiagnosisResult';

interface TreatmentPlanDiagnosis {
  id: string;
  resultLabel: string;
  confidence?: number | null;
  adviceText?: string | null;
  source?: string;
  detailJson?: string | null;
  resolved?: boolean;
  symptomsText?: string | null;
  createdAt?: string;
}

interface TreatmentPlanCardProps {
  diagnosis: TreatmentPlanDiagnosis;
  updating?: boolean;
  followUpCreating?: boolean;
  hasFollowUpTask?: boolean;
  onResolvedChange?: (resolved: boolean) => void;
  onCreateFollowUp?: (dueInDays: number) => Promise<void>;
}

export default function TreatmentPlanCard({
  diagnosis,
  updating,
  followUpCreating,
  hasFollowUpTask,
  onResolvedChange,
  onCreateFollowUp,
}: TreatmentPlanCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-white p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Treatment plan
        </p>
        <h3 className="mt-1 font-semibold text-emerald-950">Latest diagnosis</h3>
        {diagnosis.symptomsText ? (
          <p className="mt-1 text-sm text-gray-600">Reported: {diagnosis.symptomsText}</p>
        ) : null}
      </div>
      <DiagnosisResult
        diagnosis={diagnosis}
        updating={updating}
        onResolvedChange={onResolvedChange}
        onCreateFollowUp={onCreateFollowUp}
        followUpCreating={followUpCreating}
        hasFollowUpTask={hasFollowUpTask}
      />
    </div>
  );
}
