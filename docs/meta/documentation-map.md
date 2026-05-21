# Complete documentation map

> **Navigation:** [Meta INDEX](INDEX.md) · [Master INDEX](../INDEX.md)

Every documentation file in the Plant Care repository. **Bold** entries are INDEX hubs.

---

## Root

| File | Role |
|------|------|
| [ReadMe.md](../../ReadMe.md) | Project entry point |
| [docs/INDEX.md](../INDEX.md) | **Master tutorial & instructions hub** |
| [docs/application-overview.md](../application-overview.md) | **Complete application overview** (stack, domains, API, UI, MVP) |
| docs/DEPLOY.md | Deploy quick reference (→ operations/deployment.md) |

---

## guides/ (complete aspect guides)

| File |
|------|
| **INDEX.md** |
| 01-introduction-and-quick-start.md |
| 02-development-handbook.md |
| 03-architecture-and-system-design.md |
| 04-data-model-and-persistence.md |
| 05-api-complete-reference.md |
| 06-care-guides-and-content.md |
| 07-web-application.md |
| 08-ui-components-and-design.md |
| 09-integrations-and-external-services.md |
| 10-end-user-product-guide.md |
| 11-tutorials-and-walkthroughs.md |
| 12-mobile-and-client-packaging.md |
| 13-operations-deployment-and-quality.md |
| 14-product-qa-and-roadmap.md |

---

## meta/

| File |
|------|
| **INDEX.md** |
| documentation-map.md (this file) |
| for-ai-agents.md |
| doc-templates.md |
| glossary.md |

---

## getting-started/

| File |
|------|
| **INDEX.md** |
| quick-start.md |
| development-setup.md |
| environment.md |
| database.md |
| email-and-auth-setup.md |
| running-services.md |
| troubleshooting.md |

---

## tutorials/

| File |
|------|
| **INDEX.md** |
| first-time-developer.md |
| first-time-user.md |
| adding-a-plant.md |
| completing-tasks.md |
| reading-care-instructions.md |
| outdoor-vs-indoor-plants.md |
| changing-plant-location.md |
| using-dr-plant-chat.md |
| one-shot-diagnosis.md |
| journal-and-notes.md |

---

## user-guide/

| File |
|------|
| **INDEX.md** |
| landing-and-auth.md |
| onboarding.md |
| garden-dashboard.md |
| browse-plants.md |
| add-plant.md |
| plant-profile.md |
| task-calendar.md |
| household.md |
| community.md |
| settings.md |
| subscription.md |

---

## architecture/

| File |
|------|
| **INDEX.md** |
| system-overview.md |
| monorepo.md |
| request-flow.md |
| auth-and-security.md |
| scheduling.md |
| care-guide-pipeline.md |
| diagnosis-pipeline.md |

---

## api/

| File |
|------|
| **INDEX.md** |
| overview.md |
| authentication.md |
| users.md |
| species.md |
| plants.md |
| tasks.md |
| dashboard.md |
| gardens.md |
| community.md |
| diagnosis.md |
| journal.md |
| billing.md |
| notifications.md |
| weather.md |
| health-and-static.md |

---

## web/

| File |
|------|
| **INDEX.md** |
| routing.md |
| state-and-api-client.md |
| **pages/INDEX.md** |
| pages/auth.md |
| pages/onboarding.md |
| pages/dashboard.md |
| pages/browse-plants.md |
| pages/add-plant.md |
| pages/plant-profile.md |
| pages/tasks.md |
| pages/household.md |
| pages/community.md |
| pages/settings.md |
| pages/subscription.md |
| pages/landing.md |
| **components/INDEX.md** |
| components/layout-and-shell.md |
| components/task-instructions.md |
| components/dr-plant-chat.md |
| components/diagnosis-result.md |
| components/tasks-ui.md |

---

## database/

| File |
|------|
| **INDEX.md** |
| schema-reference.md |
| seeding.md |
| migrations.md |
| **models/INDEX.md** |
| models/user-and-subscription.md |
| models/species-and-care-guide.md |
| models/plant-and-task.md |
| models/diagnosis-and-journal.md |
| models/collaboration-and-community.md |

---

## care-guides/

| File |
|------|
| **INDEX.md** |
| content-model.md |
| templates-and-placeholders.md |
| classification.md |
| growing-environment.md |
| assets.md |
| verification.md |

---

## integrations/

| File |
|------|
| **INDEX.md** |
| openai.md |
| smtp.md |
| stripe.md |
| plantnet.md |
| perenual.md |
| huggingface.md |
| weather.md |
| storage.md |

---

## operations/

| File |
|------|
| **INDEX.md** |
| deployment.md |
| ci.md |
| scripts.md |
| testing.md |

---

## reference/

| File |
|------|
| **INDEX.md** |
| npm-scripts.md |
| environment-variables.md |
| routes-quick-reference.md |
| file-tree.md |
| feature-availability.md |
| shared-package.md |

---

## Suggested drill-down by question type

| Question | Start → Then |
|----------|----------------|
| How do I run the app? | getting-started/quick-start.md |
| What does this screen do? | user-guide/ → specific screen |
| What endpoint do I call? | api/ → module doc |
| What table stores X? | database/models/ |
| Why is misting scheduled? | care-guides/growing-environment.md + architecture/scheduling.md |
| OpenAI 429 / quota | integrations/openai.md + getting-started/troubleshooting.md |
