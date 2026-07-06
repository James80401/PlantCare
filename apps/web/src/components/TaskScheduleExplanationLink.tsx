import { useState } from 'react';
import TaskScheduleExplanationModal from './TaskScheduleExplanationModal';

interface TaskScheduleExplanationLinkProps {
  taskId: string;
  taskType: string;
  plantLabel: string;
  className?: string;
}

export default function TaskScheduleExplanationLink({
  taskId,
  taskType,
  plantLabel,
  className = '',
}: TaskScheduleExplanationLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-full bg-lime-50 px-3 py-1.5 text-xs font-semibold text-lime-900 ring-1 ring-lime-100 transition hover:bg-lime-100 hover:text-lime-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 ${className}`}
      >
        Why this date?
      </button>
      {open && (
        <TaskScheduleExplanationModal
          taskId={taskId}
          taskType={taskType}
          plantLabel={plantLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
