import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DiagnosisForm from '../../components/DiagnosisForm';
import DiagnosisResult from '../../components/DiagnosisResult';
import DrPlantChat from '../../components/DrPlantChat';
import DrPlantContextPanel from '../../components/DrPlantContextPanel';
import TreatmentPlanCard from '../../components/TreatmentPlanCard';
import { taskTypeLabel } from '../../utils/tasks';
import { DR_PLANT_SECTION_ID } from './constants';
import { HealthStickyDrPlant } from './HealthStickyDrPlant';
import { usePlantProfile } from './PlantProfileContext';
import { ProfileSection, RecoveryPanel, SectionEmptyState } from './shared';

export default function PlantHealthTab() {
  const ctx = usePlantProfile();
  const location = useLocation();
  const recoveryTasks = ctx.pending.filter((task) => Boolean(task.sourceDiagnosisId));

  useEffect(() => {
    if (location.hash.replace('#', '') !== DR_PLANT_SECTION_ID) return;
    const el = document.getElementById(DR_PLANT_SECTION_ID);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, location.pathname]);

  return (
    <>
      <ProfileSection
        eyebrow="Plant health"
        title="Health"
        description="Check symptoms, ask Dr. Plant follow-ups, and keep recovery tasks moving."
      >
        <div className="space-y-5 pb-20 sm:pb-0">
          <HealthWorkflowGuide
            activeDiagnosisCount={ctx.activeDiagnosisCount}
            diagnosisCount={ctx.diagnosisEntries.length}
            recoveryTaskCount={recoveryTasks.length}
          />

          <DrPlantContextPanel plantId={ctx.id} />

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Structured symptom check
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Use this when you want one saved diagnosis with intake details and an optional photo.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                Saved to health history
              </span>
            </div>
            <div className="mt-3">
              <DiagnosisForm plantName={ctx.plantLabel} onSubmit={ctx.submitDiagnosis} />
            </div>
          </section>

          <DrPlantChat plantId={ctx.id} plantName={ctx.plantLabel} />

          <RecoveryPanel
            activeCount={ctx.activeDiagnosisCount}
            onLogRecovery={() => {
              ctx.appendJournalPrompt('Recovery check:');
              ctx.goToJournalTab();
            }}
          />

          <RecoveryTimeline tasks={recoveryTasks} onComplete={ctx.handleCompleteTask} />

          {ctx.latestUnresolved ? (
            <TreatmentPlanCard
              plantId={ctx.id}
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
              onCreateFollowUp={(dueInDays, note) =>
                ctx.createFollowUpTask(ctx.latestUnresolved!.id as string, dueInDays, note)
              }
              onRecoveryTasksApplied={() => ctx.load()}
            />
          ) : null}

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
                        imageUrl: diagnosis.imageUrl as string | null,
                        symptomsText: diagnosis.symptomsText as string | null,
                        createdAt: diagnosis.createdAt as string | undefined,
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
                          : (dueInDays, note) =>
                              ctx.createFollowUpTask(diagnosis.id as string, dueInDays, note)
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
      <HealthStickyDrPlant />
    </>
  );
}

function HealthWorkflowGuide({
  activeDiagnosisCount,
  diagnosisCount,
  recoveryTaskCount,
}: {
  activeDiagnosisCount: number;
  diagnosisCount: number;
  recoveryTaskCount: number;
}) {
  const steps = [
    {
      label: '1. Gather context',
      body: 'Check what Dr. Plant can already see from care history, tasks, journal notes, and weather context.',
    },
    {
      label: '2. Choose the lane',
      body: 'Use structured diagnosis for a saved photo-backed result, or chat for follow-up questions and recovery planning.',
    },
    {
      label: '3. Track recovery',
      body: 'Turn advice into health-check tasks, journal recovery notes, and mark the issue recovered when stable.',
    },
  ];

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Health workflow
          </p>
          <h3 className="mt-1 font-semibold text-emerald-950">
            Start with context, then turn advice into follow-up
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-100">
            {diagnosisCount} saved
          </span>
          {activeDiagnosisCount > 0 ? (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-800 ring-1 ring-rose-100">
              {activeDiagnosisCount} active
            </span>
          ) : null}
          {recoveryTaskCount > 0 ? (
            <span className="rounded-full bg-lime-50 px-3 py-1 text-lime-900 ring-1 ring-lime-100">
              {recoveryTaskCount} follow-up
            </span>
          ) : null}
        </div>
      </div>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step) => (
          <li key={step.label} className="rounded-2xl bg-emerald-50/60 px-3 py-3">
            <p className="text-sm font-semibold text-emerald-950">{step.label}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RecoveryTimeline({
  tasks,
  onComplete,
}: {
  tasks: Array<Record<string, unknown>>;
  onComplete: (taskId: string) => void;
}) {
  if (tasks.length === 0) return null;

  return (
    <section className="rounded-2xl border border-lime-100 bg-lime-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">
            Recovery timeline
          </p>
          <h3 className="mt-1 font-semibold text-emerald-950">Active follow-up tasks</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-lime-900 ring-1 ring-lime-100">
          {tasks.length} open
        </span>
      </div>
      <ol className="mt-3 space-y-2">
        {tasks.slice(0, 5).map((task) => {
          const id = String(task.id);
          const dueDate = task.dueDate ? new Date(String(task.dueDate)) : null;
          return (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2.5 text-sm ring-1 ring-lime-100"
            >
              <div>
                <p className="font-semibold text-emerald-950">
                  {taskTypeLabel(String(task.taskType))}
                </p>
                <p className="text-xs text-gray-500">
                  {dueDate ? `Due ${dueDate.toLocaleDateString()}` : 'Recovery follow-up'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onComplete(id)}
                className="min-h-9 rounded-full bg-lime-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-lime-800"
              >
                Mark done
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
