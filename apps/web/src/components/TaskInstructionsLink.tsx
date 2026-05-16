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
        className={`text-emerald-700 hover:text-emerald-900 text-sm font-medium underline underline-offset-2 ${className}`}
      >
        How to do this
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
