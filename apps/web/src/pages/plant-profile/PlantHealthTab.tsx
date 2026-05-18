import DiagnosisForm from '../../components/DiagnosisForm';
import DiagnosisResult from '../../components/DiagnosisResult';
import DrPlantChat from '../../components/DrPlantChat';
import TreatmentPlanCard from '../../components/TreatmentPlanCard';
import { usePlantProfile } from './PlantProfileContext';
import { ProfileSection, RecoveryPanel, SectionEmptyState } from './shared';

export default function PlantHealthTab() {
  const ctx = usePlantProfile();

  return (
    <ProfileSection
      eyebrow="Plant health"
      title="Diagnosis"
      description="Ask Dr. Plant about symptoms and review past diagnosis results."
    >
      <div className="space-y-5">
        <RecoveryPanel
          activeCount={ctx.activeDiagnosisCount}
          onLogRecovery={() => {
            ctx.appendJournalPrompt('Recovery check:');
            ctx.goToJournalTab();
          }}
        />

        {ctx.latestUnresolved ? (
          <TreatmentPlanCard
            diagnosis={{
              id: ctx.latestUnresolved.id as string,
              resultLabel: ctx.latestUnresolved.resultLabel as string,
              confidence: ctx.latestUnresolved.confidence as number | null,
              adviceText: ctx.latestUnresolved.adviceText as string | null,
              source: ctx.latestUnresolved.source as string | undefined,
              detailJson: ctx.latestUnresolved.detailJson as string | null,
              resolved: Boolean(ctx.latestUnresolved.resolved),
              symptomsText: ctx.latestUnresolved.symptomsText as string | null,
            }}
            updating={ctx.updatingDiagnosisId === ctx.latestUnresolved.id}
            followUpCreating={ctx.followUpCreatingId === ctx.latestUnresolved.id}
            hasFollowUpTask={ctx.diagnosisHasFollowUp(ctx.latestUnresolved.id as string)}
            onResolvedChange={(resolved) =>
              ctx.updateDiagnosisStatus(ctx.latestUnresolved!.id as string, resolved)
            }
            onCreateFollowUp={(dueInDays) =>
              ctx.createFollowUpTask(ctx.latestUnresolved!.id as string, dueInDays)
            }
          />
        ) : null}

        <DiagnosisForm plantName={ctx.plantLabel} onSubmit={ctx.submitDiagnosis} />

        <DrPlantChat plantId={ctx.id} plantName={ctx.plantLabel} />

        {ctx.diagnosisEntries.length ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-emerald-950">Past diagnoses</h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {ctx.activeDiagnosisCount} active
              </span>
            </div>
            <ul className="mt-3 space-y-3">
              {ctx.diagnosisEntries.map((diagnosis) => (
                <li key={diagnosis.id as string}>
                  <DiagnosisResult
                    diagnosis={{
                      resultLabel: diagnosis.resultLabel as string,
                      confidence: diagnosis.confidence as number | null,
                      adviceText: diagnosis.adviceText as string | null,
                      source: diagnosis.source as string | undefined,
                      detailJson: diagnosis.detailJson as string | null,
                      resolved: Boolean(diagnosis.resolved),
                    }}
                    updating={ctx.updatingDiagnosisId === diagnosis.id}
                    followUpCreating={ctx.followUpCreatingId === diagnosis.id}
                    hasFollowUpTask={ctx.diagnosisHasFollowUp(diagnosis.id as string)}
                    onResolvedChange={(resolved) =>
                      ctx.updateDiagnosisStatus(diagnosis.id as string, resolved)
                    }
                    onCreateFollowUp={
                      diagnosis.id === ctx.latestUnresolved?.id
                        ? undefined
                        : (dueInDays) =>
                            ctx.createFollowUpTask(diagnosis.id as string, dueInDays)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <SectionEmptyState
            title="No diagnosis history"
            body="If this plant looks stressed, start a Dr. Plant chat and add a clear photo."
          />
        )}
      </div>
    </ProfileSection>
  );
}
