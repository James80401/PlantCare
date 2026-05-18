import TaskRow from '../../components/tasks/TaskRow';
import { usePlantProfile } from './PlantProfileContext';
import { ProfileSection, SectionEmptyState } from './shared';

export default function PlantTasksTab() {
  const ctx = usePlantProfile();

  return (
    <ProfileSection
      eyebrow="Schedule"
      title="Tasks"
      description="Upcoming care actions for this plant. Open care steps before completing unfamiliar tasks."
    >
      {ctx.plantPendingFromHook.length ? (
        <ul className="space-y-2">
          {ctx.plantPendingFromHook.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                animState={ctx.animating[task.id] ?? null}
                onComplete={ctx.handleCompleteTask}
                onSkip={ctx.handleSkipTask}
                onSnooze={ctx.handleSnooze}
                linkPlant={false}
              />
            </li>
          ))}
        </ul>
      ) : (
        <SectionEmptyState
          title="No pending tasks"
          body="This plant is caught up in the current schedule window."
        />
      )}
    </ProfileSection>
  );
}
