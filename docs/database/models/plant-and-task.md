# Models: Plant and task

> **Navigation:** [Models INDEX](INDEX.md)

## Plant

`userId`, `speciesId`, `nickname`, `location`, `potSize`, `datePlanted`, `imageUrl`, `notes`.

## Task

`plantId`, `taskType`, `dueDate`, `status` (PENDING/DONE/SKIPPED), `completedAt`.

Indexed for scheduler queries by plant + status.
