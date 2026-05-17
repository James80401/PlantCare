# Models: Plant and task

> **Navigation:** [Models INDEX](INDEX.md)

## Plant

`userId`, `speciesId`, `nickname`, `location`, `potSize`, `datePlanted`, `imageUrl`, `notes`.

## Task

`plantId`, `taskType`, `dueDate`, `status` (PENDING/DONE/SKIPPED), `completedAt`.

Indexed for scheduler queries by plant + status.

## TaskFeedback

Stores user feedback about task actions, starting with skipped tasks.

Fields: `taskId`, `userId`, `action`, `reason`, optional `note`, `createdAt`.

Initial skip reasons: soil still wet, plant looks healthy, rain handled watering,
too busy, other. This creates the data foundation for later adaptive scheduling.
