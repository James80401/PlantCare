# Documentation templates

> **Navigation:** [Meta INDEX](INDEX.md) · [For AI agents](for-ai-agents.md)

## Screen doc triad

For each major user-facing route, maintain up to three linked docs:

| Layer | Folder | Purpose |
|-------|--------|---------|
| **User guide** | `docs/user-guide/` | What the user sees and does |
| **Tutorial** | `docs/tutorials/` | Step-by-step procedure (if non-obvious) |
| **Web page** | `docs/web/pages/` | React file, hooks, API calls |

Each doc should include a **Navigation** line and cross-links to the other two layers when they exist.

Example — Add plant:

- [user-guide/add-plant.md](../user-guide/add-plant.md)
- [tutorials/adding-a-plant.md](../tutorials/adding-a-plant.md)
- [web/pages/add-plant.md](../web/pages/add-plant.md)

## Leaf doc header

```markdown
# Tutorial: Feature name

> **Navigation:** [Tutorials INDEX](INDEX.md) · [User guide: add plant](../user-guide/add-plant.md)

...
```

## API-only features

If the API exists but the web app has no create UI, document it in:

1. Tutorial with an explicit callout (see [one-shot-diagnosis.md](../tutorials/one-shot-diagnosis.md))
2. [reference/feature-availability.md](../reference/feature-availability.md)
3. Master [feature map](../INDEX.md#feature--documentation-map) (Web column: `—` or “API only”)

## Doc change checklist

When shipping a user-facing change:

1. Update the **leaf** doc(s) for affected screens
2. Update the folder **`INDEX.md`** if you add a file
3. Add or update the row in the master **[feature map](../INDEX.md#feature--documentation-map)**
4. Add an entry in **[documentation-map.md](documentation-map.md)**
5. Update **[feature-availability.md](../reference/feature-availability.md)** if web/API exposure changes
6. Add or adjust a **learning path** step on [master INDEX](../INDEX.md#learning-paths) if it is a core user flow
7. When changing `apps/web/src/pages/*.tsx`, consider updating user-guide in the same PR

## Learning paths (master INDEX)

| Path | Audience |
|------|----------|
| A | Developer — run locally |
| B | Gardener / tester — use the product |
| C | Implementer — full-stack feature work |
| D | Ops — deploy and CI |

Do not add tutorials to `tutorials/INDEX.md` without placing them on Path B or documenting them as API-only / developer-only.
