import { useState } from 'react';
import TaskInstructionsModal from './TaskInstructionsModal';

interface TaskInstructionsLinkProps {
  taskId: string;
  taskType: string;
  plantLabel: string;
  className?: string;
}

export default function TaskInstructionsLink({
  taskId,
  taskType,
  plantLabel,
  className = '',
}: TaskInstructionsLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 transition hover:bg-emerald-100 hover:text-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${className}`}
      >
        Care steps
      </button>
      {open && (
        <TaskInstructionsModal
          taskId={taskId}
          taskType={taskType}
          plantLabel={plantLabel}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
